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
  const {
    lastLoginTime,
    passwordResetRequests = [],
    resolvePasswordReset = () => {},
  } = useApp?.() || {}
  const { user: currentUser } = useAuth()
  const { clients, statuses, alertSettings, loading } = useDashboard()
  const [showLoginAlert, setShowLoginAlert] = useState(false)
  const pendingResets = passwordResetRequests.filter((req: any) => req.status === 'pending')

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
    'audit_logs',
    (e) => {
      if (e.action === 'create' && e.record.action === 'password_reset_request') {
        if (currentUser?.role?.toLowerCase() === 'admin') {
          toast({
            title: 'Solicitação de Redefinição de Senha',
            description: e.record.details || 'Um usuário solicitou a redefinição de senha.',
            duration: 10000,
          })
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

  const baixaStatusId = statuses.find((s) => s.name.toLowerCase() === 'baixa')?.id
  const pendingClients = clients.filter((c) => c.status !== baixaStatusId)
  const totalPending = pendingClients.length

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
        description: `O sistema registra atualmente ${totalPending} clientes com pendências, excedendo o limite crítico configurado de ${alertSettings.critical_threshold}. É necessária ação imediata.`,
        icon: AlertTriangle,
        className:
          'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-900',
      }
    } else if (totalPending >= alertSettings.moderate_threshold) {
      systemAlert = {
        type: 'moderate',
        title: 'Aviso de Volume de Pendências',
        description: `O número de clientes com pendências (${totalPending}) ultrapassou o limite moderado de ${alertSettings.moderate_threshold}. Acompanhe de perto para evitar acúmulos.`,
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
              Novos Clientes Cadastrados
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-base mt-2">
              Você possui novos clientes cadastrados no sistema desde o seu último acesso. Verifique
              o módulo de clientes para mais detalhes.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {currentUser?.role?.toLowerCase() === 'admin' && pendingResets.length > 0 && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 animate-fade-in-down">
          <div className="flex items-start gap-3">
            <div className="bg-yellow-500/20 p-2 rounded-full mt-0.5">
              <KeyRound className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">
                Solicitações de Redefinição de Senha
              </h3>
              <p className="text-sm text-yellow-700/80 dark:text-yellow-400/80 mt-1 mb-3">
                Operadores solicitaram a redefinição de suas senhas. Acesse o menu de Usuários para
                alterar a senha e marque como resolvido.
              </p>
              <div className="space-y-2">
                {pendingResets.map((req: any) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between bg-white/50 dark:bg-black/20 p-2 rounded-md border border-yellow-500/10"
                  >
                    <span className="text-sm font-medium">{req.email}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => resolvePasswordReset(req.id)}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Marcar como Resolvido
                    </Button>
                  </div>
                ))}
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
