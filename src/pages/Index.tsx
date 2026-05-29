import { useEffect, useState } from 'react'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { DashboardCharts } from '@/components/dashboard/charts'
import { AlertsWidget } from '@/components/dashboard/alerts-widget'
import { useApp } from '@/contexts/app-context'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useDashboard } from '@/hooks/use-dashboard'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from '@/hooks/use-toast'
import { getClientAlertState } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { BellRing, KeyRound, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

const Index = () => {
  const { lastLoginTime } = useApp?.() || {}
  const { user: currentUser } = useAuth()
  const { clients, statuses, alertSettings, loading } = useDashboard()
  const [showLoginAlert, setShowLoginAlert] = useState(false)
  const [resetRequests, setResetRequests] = useState<any[]>([])
  const [operatorNotifications, setOperatorNotifications] = useState<any[]>([])

  useEffect(() => {
    if (currentUser?.role?.toLowerCase() === 'admin') {
      pb.collection('notifications')
        .getFullList({
          filter: "type = 'password_reset' && resolved = false",
          sort: '-created',
          expand: 'user',
        })
        .then(setResetRequests)
        .catch(console.error)
    } else if (currentUser) {
      pb.collection('notifications')
        .getFullList({
          filter: `user = "${currentUser.id}" && resolved = false && (type ~ 'payroll_education' || type ~ 'financial_education')`,
          sort: '-created',
        })
        .then(setOperatorNotifications)
        .catch(console.error)
    }
  }, [currentUser])

  const pendingResets = resetRequests

  const handleResolveReset = async (id: string) => {
    try {
      await pb.collection('notifications').update(id, { resolved: true })
      toast({
        title: 'Resolvido',
        description: 'Solicitação de senha marcada como resolvida.',
      })
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const initCheck = async () => {
      if (currentUser && !currentUser.last_clients_check) {
        try {
          const now = new Date().toISOString()
          const updatedUser = await pb.collection('users').update(currentUser.id, {
            last_clients_check: now,
          })
          pb.authStore.save(pb.authStore.token, updatedUser)
        } catch (e) {
          console.error('Failed to initialize last_clients_check', e)
        }
      }
    }
    initCheck()
  }, [currentUser])

  useEffect(() => {
    if (currentUser?.last_clients_check && clients.length > 0) {
      const lastCheck = new Date(currentUser.last_clients_check)
      const hasNewClients = clients.some((c) => new Date(c.created) > lastCheck)
      setShowLoginAlert(hasNewClients)
    }
  }, [currentUser?.last_clients_check, clients])

  useRealtime(
    'notifications',
    (e) => {
      if (e.action === 'create' && e.record.type === 'password_reset' && !e.record.resolved) {
        if (currentUser?.role?.toLowerCase() === 'admin') {
          toast({
            title: 'Solicitação de Redefinição de Senha',
            description: 'Um usuário solicitou a redefinição de senha. Verifique os alertas.',
            duration: 10000,
          })
          setResetRequests((prev) => [e.record, ...prev])
        }
      } else if (e.action === 'delete') {
        setResetRequests((prev) => prev.filter((r) => r.id !== e.record.id))
      } else if (e.action === 'update' && e.record.type === 'password_reset') {
        if (e.record.resolved) {
          setResetRequests((prev) => prev.filter((r) => r.id !== e.record.id))
        } else {
          setResetRequests((prev) => {
            const exists = prev.find((r) => r.id === e.record.id)
            return exists
              ? prev.map((r) => (r.id === e.record.id ? e.record : r))
              : [e.record, ...prev]
          })
        }
      }

      if (currentUser?.role?.toLowerCase() !== 'admin' && e.record.user === currentUser?.id) {
        if (
          e.action === 'create' &&
          !e.record.resolved &&
          (e.record.type.includes('payroll_education') ||
            e.record.type.includes('financial_education'))
        ) {
          setOperatorNotifications((prev) => [e.record, ...prev])
        } else if (e.action === 'delete') {
          setOperatorNotifications((prev) => prev.filter((n) => n.id !== e.record.id))
        } else if (
          e.action === 'update' &&
          (e.record.type.includes('payroll_education') ||
            e.record.type.includes('financial_education'))
        ) {
          if (e.record.resolved) {
            setOperatorNotifications((prev) => prev.filter((n) => n.id !== e.record.id))
          } else {
            setOperatorNotifications((prev) => {
              const exists = prev.find((n) => n.id === e.record.id)
              return exists
                ? prev.map((n) => (n.id === e.record.id ? e.record : n))
                : [e.record, ...prev]
            })
          }
        }
      }
    },
    !!currentUser,
  )

  const handleCloseAlert = async (open: boolean) => {
    if (!open) {
      setShowLoginAlert(false)
      if (currentUser?.id) {
        try {
          const now = new Date()
          now.setSeconds(now.getSeconds() + 1)
          const updatedUser = await pb.collection('users').update(currentUser.id, {
            last_clients_check: now.toISOString(),
          })
          pb.authStore.save(pb.authStore.token, updatedUser)
        } catch (e) {
          console.error('Failed to update last check', e)
        }
      }
    }
  }

  const isAdmin = currentUser?.role?.toLowerCase() === 'admin'

  let moderateCount = 0
  let criticalCount = 0
  let oldAdminCount = 0
  let monthCriticalCount = 0

  if (!loading) {
    clients.forEach((c) => {
      const belongsToUser = isAdmin ? true : c.colaborador_id === currentUser?.id
      if (!belongsToUser) return

      const { isCritical, isModerate, isOldAdmin, isMonthCritical } = getClientAlertState(
        c,
        alertSettings,
        isAdmin,
      )

      if (isMonthCritical) monthCriticalCount++
      if (isCritical) criticalCount++
      if (isModerate) moderateCount++
      if (isOldAdmin) oldAdminCount++
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Bom dia'
    if (hour >= 12 && hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const userName = currentUser?.name?.trim()

  let systemAlert = null
  if (!loading && alertSettings) {
    if (monthCriticalCount > 0) {
      systemAlert = {
        type: 'critical',
        title: 'Virada de Mês Sem Atualização',
        description: `${monthCriticalCount} atendimento(s) com status Aguardando ou Atenção pendentes desde o mês anterior.`,
        icon: AlertTriangle,
        className:
          'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-900',
      }
    } else if (criticalCount > 0) {
      systemAlert = {
        type: 'critical',
        title: 'Alerta Crítico de Pendências',
        description: `${criticalCount} atendimento(s) sem atualização há mais de ${alertSettings.critical_days ?? 30} dias.`,
        icon: AlertTriangle,
        className:
          'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-900',
      }
    } else if (moderateCount > 0) {
      systemAlert = {
        type: 'moderate',
        title: 'Aviso de Pendências em Aberto',
        description: `${moderateCount} atendimento(s) com status Aguardando sem atualização há mais de ${alertSettings.old_days ?? 15} dias.`,
        icon: Info,
        className:
          'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-900',
      }
    } else if (isAdmin && oldAdminCount > 0) {
      systemAlert = {
        type: 'oldAdmin',
        title: 'Pagamentos Abertos Antigos',
        description: `${oldAdminCount} atendimento(s) com Pgto Aberto sem atualização há mais de ${alertSettings.old_admin_days ?? 15} dias.`,
        icon: Info,
        className:
          'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-900',
      }
    }
  }

  return (
    <div className="space-y-2 animate-fade-in">
      {systemAlert && (
        <Alert
          className={`mb-4 border-l-4 animate-fade-in-down shadow-sm ${systemAlert.className}`}
        >
          <systemAlert.icon className="h-5 w-5" />
          <AlertTitle className="font-semibold">{systemAlert.title}</AlertTitle>
          <AlertDescription className="mt-1">{systemAlert.description}</AlertDescription>
        </Alert>
      )}

      <Dialog open={showLoginAlert} onOpenChange={handleCloseAlert}>
        <DialogContent className="sm:max-w-md bg-[#0b1121] border-[#1e3a8a] text-white [&>button]:text-slate-400 [&>button]:hover:text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-xl">
              <BellRing className="w-5 h-5 text-blue-500" />
              Novos Atendimentos Cadastrados
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-base mt-2">
              Você possui novos atendimentos cadastrados no sistema desde o seu último acesso.
              Verifique o módulo de clientes para mais detalhes.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {currentUser?.role?.toLowerCase() !== 'admin' && operatorNotifications.length > 0 && (
        <div className="mb-6 space-y-3 animate-fade-in-down">
          {operatorNotifications.map((notif) => (
            <Alert
              key={notif.id}
              className="bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <AlertTitle className="font-semibold m-0 text-emerald-800 dark:text-emerald-300">
                    Nova Educação Financeira
                  </AlertTitle>
                  <AlertDescription className="mt-1 text-emerald-700 dark:text-emerald-400/90 text-sm">
                    Sua nova folha de pagamento e saúde financeira já estão disponíveis.
                  </AlertDescription>
                </div>
              </div>
              <Button
                size="sm"
                asChild
                className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
              >
                <Link to="/saude-financeira">Acessar Saúde Financeira</Link>
              </Button>
            </Alert>
          ))}
        </div>
      )}

      {currentUser?.role?.toLowerCase() === 'admin' && pendingResets.length > 0 && (
        <div className="mb-6 bg-[#fdfaf3] border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/50 rounded-xl p-5 animate-fade-in-down shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-amber-100/80 dark:bg-amber-900/50 p-2.5 rounded-full mt-0.5">
              <KeyRound className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-300 text-lg tracking-tight">
                Solicitações de Redefinição de Senha
              </h3>
              <p className="text-[15px] text-amber-800/80 dark:text-amber-400/80 mt-1 mb-4 leading-relaxed">
                Operadores solicitaram a redefinição de suas senhas. Acesse o menu de Usuários para
                alterar a senha e marque como resolvido.
              </p>
              <div className="space-y-3">
                {pendingResets.map((req: any) => {
                  const userEmail = req.expand?.user?.email || 'Desconhecido'
                  const reqUserName = req.expand?.user?.name
                    ? `${req.expand.user.name} (${userEmail})`
                    : userEmail
                  return (
                    <div
                      key={req.id}
                      className="flex items-center justify-between bg-white dark:bg-slate-900/50 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm transition-all"
                    >
                      <span className="text-[15px] font-medium text-slate-700 dark:text-slate-200">
                        {reqUserName}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-4 rounded-full text-sm font-medium border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                        onClick={() => handleResolveReset(req.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Marcar como Resolvido
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1 mb-8">
        <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-slate-800 dark:text-slate-100">
          {userName ? `${getGreeting()}, ${userName}!` : 'Bem-vindo(a)!'}
        </h2>
        <p className="text-slate-500 text-sm">Acompanhe as métricas e alertas do sistema.</p>
      </div>

      <KpiCards />
      <DashboardCharts />
      <AlertsWidget />
    </div>
  )
}

export default Index
