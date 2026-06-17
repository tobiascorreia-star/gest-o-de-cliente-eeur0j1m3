import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { DashboardCharts } from '@/components/dashboard/charts'
import { AlertsWidget } from '@/components/dashboard/alerts-widget'
import { PushNotificationBanner } from '@/components/push-notification-button'
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
import {
  BellRing,
  KeyRound,
  CheckCircle,
  AlertTriangle,
  Info,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
      toast({ title: 'Resolvido', description: 'Solicitação marcada como resolvida.' })
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const initCheck = async () => {
      if (currentUser && !currentUser.last_clients_check) {
        try {
          const now = new Date().toISOString()
          const updatedUser = await pb.collection('users').update(currentUser.id, { last_clients_check: now })
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
            description: 'Um usuário solicitou redefinição de senha. Verifique os alertas.',
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
          (e.record.type.includes('payroll_education') || e.record.type.includes('financial_education'))
        ) {
          setOperatorNotifications((prev) => [e.record, ...prev])
        } else if (e.action === 'delete') {
          setOperatorNotifications((prev) => prev.filter((n) => n.id !== e.record.id))
        } else if (
          e.action === 'update' &&
          (e.record.type.includes('payroll_education') || e.record.type.includes('financial_education'))
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
        c, alertSettings, isAdmin,
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

  const userName = currentUser?.name?.split(' ')[0]?.trim()

  let systemAlert = null
  if (!loading && alertSettings) {
    if (monthCriticalCount > 0) {
      systemAlert = {
        type: 'critical',
        title: 'Virada de Mês Sem Atualização',
        description: `${monthCriticalCount} atendimento(s) com status Aguardando ou Atenção pendentes desde o mês anterior.`,
        icon: AlertTriangle,
        className: 'border-red-500/30 bg-red-500/8 text-red-400 dark:text-red-300',
      }
    } else if (criticalCount > 0) {
      systemAlert = {
        type: 'critical',
        title: 'Alerta Crítico de Pendências',
        description: `${criticalCount} atendimento(s) sem atualização há mais de ${alertSettings.critical_days ?? 30} dias.`,
        icon: AlertTriangle,
        className: 'border-red-500/30 bg-red-500/8 text-red-400 dark:text-red-300',
      }
    } else if (moderateCount > 0) {
      systemAlert = {
        type: 'moderate',
        title: 'Aviso de Pendências em Aberto',
        description: `${moderateCount} atendimento(s) sem atualização há mais de ${alertSettings.old_days ?? 15} dias.`,
        icon: Info,
        className: 'border-amber-500/30 bg-amber-500/8 text-amber-400 dark:text-amber-300',
      }
    } else if (isAdmin && oldAdminCount > 0) {
      systemAlert = {
        type: 'oldAdmin',
        title: 'Pagamentos Abertos Antigos',
        description: `${oldAdminCount} atendimento(s) com Pgto Aberto sem atualização há mais de ${alertSettings.old_admin_days ?? 15} dias.`,
        icon: Info,
        className: 'border-blue-500/30 bg-blue-500/8 text-blue-400 dark:text-blue-300',
      }
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Push notification banner */}
      <PushNotificationBanner />

      {/* System alert */}
      {systemAlert && (
        <Alert className={cn('border-l-4 animate-fade-in-down rounded-xl', systemAlert.className)}>
          <systemAlert.icon className="h-4 w-4" />
          <AlertTitle className="font-semibold text-sm">{systemAlert.title}</AlertTitle>
          <AlertDescription className="text-xs mt-0.5 opacity-90">{systemAlert.description}</AlertDescription>
        </Alert>
      )}

      {/* New clients dialog */}
      <Dialog open={showLoginAlert} onOpenChange={handleCloseAlert}>
        <DialogContent className="sm:max-w-md border-cyan-800/50 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 rounded-lg bg-cyan-500/15">
                <BellRing className="w-4 h-4 text-cyan-500" />
              </div>
              Novos Atendimentos Cadastrados
            </DialogTitle>
            <DialogDescription className="text-sm mt-2 leading-relaxed">
              Você possui novos atendimentos cadastrados desde o seu último acesso. Verifique o módulo de clientes.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Operator notifications */}
      {currentUser?.role?.toLowerCase() !== 'admin' && operatorNotifications.length > 0 && (
        <div className="space-y-2 animate-fade-in-down">
          {operatorNotifications.map((notif) => (
            <Alert
              key={notif.id}
              className="border-emerald-500/25 bg-emerald-500/8 text-emerald-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/15 shrink-0 mt-0.5">
                  <BookOpen className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <AlertTitle className="font-semibold m-0 text-emerald-300 text-sm">
                    Nova Educação Financeira
                  </AlertTitle>
                  <AlertDescription className="mt-1 text-emerald-400/80 text-xs">
                    Sua nova folha de pagamento e saúde financeira estão disponíveis.
                  </AlertDescription>
                </div>
              </div>
              <Button
                size="sm"
                asChild
                className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white h-8 text-xs"
              >
                <Link to="/saude-financeira">Acessar</Link>
              </Button>
            </Alert>
          ))}
        </div>
      )}

      {/* Admin: password reset requests */}
      {isAdmin && pendingResets.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 animate-fade-in-down">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 shrink-0">
              <KeyRound className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-300 text-[15px] leading-tight">
                Solicitações de Redefinição de Senha
              </h3>
              <p className="text-xs text-amber-400/70 mt-1 mb-4">
                Acesse o menu de Usuários para alterar a senha e marque como resolvido.
              </p>
              <div className="space-y-2">
                {pendingResets.map((req: any) => {
                  const userEmail = req.expand?.user?.email || 'Desconhecido'
                  const reqUserName = req.expand?.user?.name
                    ? `${req.expand.user.name} (${userEmail})`
                    : userEmail
                  return (
                    <div
                      key={req.id}
                      className="flex items-center justify-between bg-card rounded-xl border border-border/50 p-3 gap-3"
                    >
                      <span className="text-sm font-medium text-foreground">{reqUserName}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs shrink-0"
                        onClick={() => handleResolveReset(req.id)}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Resolvido
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Greeting */}
      <div className="flex flex-col gap-1 pt-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-500" />
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {userName ? `${getGreeting()}, ${userName}!` : 'Bem-vindo(a)!'}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground ml-7">
          Acompanhe as métricas e alertas do sistema em tempo real.
        </p>
      </div>

      <KpiCards />
      <DashboardCharts />
      <AlertsWidget />
    </div>
  )
}

export default Index
