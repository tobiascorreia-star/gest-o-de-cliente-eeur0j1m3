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
import { differenceInCalendarDays } from 'date-fns'
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
      if (hasNewClients) {
        setShowLoginAlert(true)
      } else {
        setShowLoginAlert(false)
      }
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
      } else if (e.action === 'update') {
        if (e.record.type === 'password_reset') {
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

  const pendingClients = clients.filter((c) => {
    const statusName = statuses.find((s) => s.id === c.status)?.name?.toUpperCase() || ''
    return statusName !== 'BAIXA' && statusName !== 'CONCLUÍDO' && statusName !== 'CONCLUIDO'
  })
  const totalPending = pendingClients.length

  const oldDaysThreshold = alertSettings?.old_days ?? 15
  const pendingOldCount = pendingClients.filter((c) => {
    const isAdmin = currentUser?.role?.toLowerCase() === 'admin'
    const belongsToUser = isAdmin ? true : c.expand?.colaborador?.name === currentUser?.name
    if (!belongsToUser) return false

    const { isCritical, isModerate, isOldAdmin } = getClientAlertState(c, alertSettings, isAdmin)
    return isCritical || isModerate || isOldAdmin
  }).length

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Bom dia'
    if (hour >= 12 && hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const userName = currentUser?.name?.trim()

  let systemAlert = null
  if (alertSettings && !loading) {
    if (totalPending >= alertSettings.critical_threshold) {
      systemAlert = {
        type: 'critical',
        title: 'Alerta Crítico de Pendências',
        description: `O sistema registra atualmente ${totalPending} atendimentos com pendências, excedendo o limite crítico configurado de ${alertSettings.critical_threshold}. É necessária ação imediata.`,
        icon: AlertTriangle,
        className:
          'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-900',
      }
    } else if (totalPending >= alertSettings.moderate_threshold) {
      systemAlert = {
        type: 'moderate',
        title: 'Aviso de Volume de Pendências',
        description: `O número de atendimentos com pendências (${totalPending}) ultrapassou o limite moderado de ${alertSettings.moderate_threshold}. Acompanhe de perto para evitar acúmulos.`,
        icon: Info,
        className:
          'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-900',
      }
    }
  }

  return (
    <div className="space-y-2 animate-fade-in">
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
                  const userName = req.expand?.user?.name
                    ? `${req.expand.user.name} (${userEmail})`
                    : userEmail
                  return (
                    <div
                      key={req.id}
                      className="flex items-center justify-between bg-white dark:bg-slate-900/50 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm transition-all"
                    >
                      <span className="text-[15px] font-medium text-slate-700 dark:text-slate-200">
                        {userName}
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

      {systemAlert && (
        <Alert
          className={`mb-6 border-l-4 animate-fade-in-down shadow-sm ${systemAlert.className}`}
        >
          <systemAlert.icon className="h-5 w-5" />
          <AlertTitle className="font-semibold">{systemAlert.title}</AlertTitle>
          <AlertDescription className="mt-1">{systemAlert.description}</AlertDescription>
        </Alert>
      )}

      {pendingOldCount > 0 && (
        <Alert className="mb-6 border-l-4 border-l-amber-500 bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900 shadow-sm animate-fade-in-down">
          <AlertDescription className="font-medium text-sm flex items-center">
            <span className="mr-2">🟡</span> Atenção: Você possui {pendingOldCount}{' '}
            {pendingOldCount === 1 ? 'atendimento pendente' : 'atendimentos pendentes'} há mais de{' '}
            {oldDaysThreshold} dias.
          </AlertDescription>
        </Alert>
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
