import { KpiCards } from '@/components/dashboard/kpi-cards'
import { DashboardCharts } from '@/components/dashboard/charts'
import { AlertsWidget } from '@/components/dashboard/alerts-widget'

const Index = () => {
  return (
    <div className="space-y-2">
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
