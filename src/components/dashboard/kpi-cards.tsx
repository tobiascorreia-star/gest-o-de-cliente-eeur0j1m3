import { Users, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboard } from '@/hooks/use-dashboard'
import { differenceInDays, startOfMonth } from 'date-fns'

export function KpiCards() {
  const { clients, statuses, alertSettings } = useDashboard()

  const baixaStatusId = statuses.find((s) => s.name.toLowerCase() === 'baixa')?.id

  const total = clients.length

  const criticalCount = clients.filter((c) => {
    if (c.status === baixaStatusId) return false
    return differenceInDays(new Date(), new Date(c.created)) >= alertSettings.critical_days
  }).length

  const oldCount = clients.filter((c) => {
    if (c.status === baixaStatusId) return false
    const days = differenceInDays(new Date(), new Date(c.created))
    return days >= alertSettings.old_days && days < alertSettings.critical_days
  }).length

  const pending = criticalCount + oldCount

  const thisMonthStart = startOfMonth(new Date())

  const completedThisMonth = clients.filter(
    (c) => c.status === baixaStatusId && new Date(c.updated) >= thisMonthStart,
  ).length

  const newClients30Days = clients.filter(
    (c) => differenceInDays(new Date(), new Date(c.created)) <= 30,
  ).length

  const cards = [
    {
      title: 'Total de Clientes',
      value: total,
      icon: Users,
      color: 'text-primary dark:text-blue-400',
      bg: 'bg-primary/10 dark:bg-primary/20',
    },
    {
      title: 'Pedidos Antigos/Críticos',
      value: pending,
      icon: AlertCircle,
      color: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      thresholds: [
        { label: 'Antigos', count: oldCount, limit: alertSettings.moderate_threshold },
        { label: 'Críticos', count: criticalCount, limit: alertSettings.critical_threshold },
      ],
    },
    {
      title: 'Concluídos no Mês',
      value: completedThisMonth,
      icon: CheckCircle2,
      color: 'text-emerald-500 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    },
    {
      title: 'Novos (30 dias)',
      value: newClients30Days,
      icon: UserPlus,
      color: 'text-indigo-500 dark:text-indigo-400',
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <Card
          key={i}
          className="hover:-translate-y-1 transition-transform duration-300 dark:bg-slate-900/50 dark:border-slate-800"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-xs font-light text-slate-500 dark:text-slate-400 flex-1 line-clamp-2">
              {card.title}
            </CardTitle>
            <div className={`p-1.5 rounded-lg shrink-0 ${card.bg}`}>
              <card.icon className={`h-3.5 w-3.5 ${card.color}`} strokeWidth={1.25} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-light text-slate-800 dark:text-slate-100">
              {card.value}
            </div>
            {card.thresholds && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-light text-slate-500 dark:text-slate-400">
                {card.thresholds.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className={t.count >= t.limit ? 'text-red-500 font-medium' : ''}>
                      {t.label}: {t.count}/{t.limit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
