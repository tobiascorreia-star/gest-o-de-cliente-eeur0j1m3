import { useEffect, useState } from 'react'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { DashboardCharts } from '@/components/dashboard/charts'
import { AlertsWidget } from '@/components/dashboard/alerts-widget'
import { useApp } from '@/contexts/app-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BellRing } from 'lucide-react'

const Index = () => {
  const { clients, lastLoginTime } = useApp()
  const [showLoginAlert, setShowLoginAlert] = useState(false)

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
