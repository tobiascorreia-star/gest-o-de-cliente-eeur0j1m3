import { useEffect, useState } from 'react'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { DashboardCharts } from '@/components/dashboard/charts'
import { AlertsWidget } from '@/components/dashboard/alerts-widget'
import { useApp } from '@/contexts/app-context'
import { useAuth } from '@/hooks/use-auth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BellRing, KeyRound, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const Index = () => {
  const { clients, lastLoginTime, passwordResetRequests, resolvePasswordReset } = useApp()
  const { user: currentUser } = useAuth()
  const [showLoginAlert, setShowLoginAlert] = useState(false)
  const pendingResets = passwordResetRequests.filter((req) => req.status === 'pending')

  useEffect(() => {
    if (lastLoginTime) {
      const hasSeenAlert = sessionStorage.getItem('hasSeenNewClientsAlert')
      if (!hasSeenAlert) {
        const hasNewClients = clients.some(
          (c) => new Date(c.dataCadastro) > new Date(lastLoginTime),
        )
        if (hasNewClients) {
          setShowLoginAlert(true)
          sessionStorage.setItem('hasSeenNewClientsAlert', 'true')
        }
      }
    }
  }, [lastLoginTime, clients])

  return (
    <div className="space-y-2">
      <Dialog open={showLoginAlert} onOpenChange={setShowLoginAlert}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-primary" />
              Novos Clientes Cadastrados
            </DialogTitle>
            <DialogDescription>
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
                {pendingResets.map((req) => (
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

      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Visão Geral</h2>
        <p className="text-muted-foreground text-sm">Acompanhe as métricas e alertas do sistema.</p>
      </div>

      <KpiCards />
      <DashboardCharts />
      <AlertsWidget />
    </div>
  )
}

export default Index
