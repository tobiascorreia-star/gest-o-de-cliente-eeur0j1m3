import { Users, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApp } from '@/contexts/app-context'
import { differenceInDays, startOfMonth } from 'date-fns'

export function KpiCards() {
  const { clients, statusList, alertConfig } = useApp()

  const baixaStatusId = statusList.find((s) => s.name === 'Baixa')?.id

  const total = clients.length

  const pending = clients.filter((c) => {
    if (c.statusId === baixaStatusId) return false
    const days = differenceInDays(new Date(), new Date(c.dataCadastro))
    return days >= alertConfig.moderateDays
  }).length

  const thisMonthStart = startOfMonth(new Date())

  const completedThisMonth = clients.filter(
    (c) => c.statusId === baixaStatusId && c.dataBaixa && new Date(c.dataBaixa) >= thisMonthStart,
  ).length

  const newClients30Days = clients.filter(
    (c) => differenceInDays(new Date(), new Date(c.dataCadastro)) <= 30,
  ).length

  const cards = [
    {
      title: 'Total de Clientes',
      value: total,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Pedidos Pendentes',
      value: pending,
      icon: AlertCircle,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Concluídos no Mês',
      value: completedThisMonth,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Novos (30 dias)',
      value: newClients30Days,
      icon: UserPlus,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <Card key={i} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
