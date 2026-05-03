import { Users, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboard } from '@/hooks/use-dashboard'
import { differenceInDays, startOfMonth } from 'date-fns'

export function KpiCards() {
  const { clients, statuses, alertSettings } = useDashboard()

  const baixaStatusId = statuses.find((s) => s.name.toLowerCase() === 'baixa')?.id

  const total = clients.length

  const pending = clients.filter((c) => {
    if (c.status === baixaStatusId) return false
    const days = differenceInDays(new Date(), new Date(c.created))
    return days >= alertSettings.old_days
  }).length

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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
