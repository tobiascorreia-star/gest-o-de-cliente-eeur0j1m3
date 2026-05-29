import { Users, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboard } from '@/hooks/use-dashboard'
import { useAuth } from '@/hooks/use-auth'
import { getClientAlertState } from '@/lib/utils'

export function KpiCards() {
  const { user } = useAuth()
  const { clients, statuses, alertSettings, loading } = useDashboard()

  const concludedStatusIds = statuses
    .filter((s) => {
      const n = s.name?.toLowerCase()
      return n === 'baixa' || n === 'concluído' || n === 'concluido'
    })
    .map((s) => s.id)

  const isAdmin = user?.role?.toLowerCase() === 'admin'

  const total = clients.length

  let criticalCount = 0
  let moderateCount = 0
  let monthCriticalCount = 0
  let oldAdminCount = 0

  if (!loading) {
    clients.forEach((c) => {
      const { isCritical, isModerate, isOldAdmin, isMonthCritical } = getClientAlertState(
        c,
        alertSettings,
        isAdmin,
      )
      if (isCritical) criticalCount++
      if (isModerate) moderateCount++
      if (isOldAdmin) oldAdminCount++
      if (isMonthCritical) monthCriticalCount++
    })
  }

  const pending = criticalCount + moderateCount + monthCriticalCount + (isAdmin ? oldAdminCount : 0)

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const completedThisMonth = clients.filter((c) => {
    if (!concludedStatusIds.includes(c.status)) return false
    const dateStr = c.data_baixa || c.updated
    if (!dateStr) return false

    const dateToCheck = new Date(dateStr)
    return dateToCheck.getMonth() === currentMonth && dateToCheck.getFullYear() === currentYear
  }).length

  const novosCount = clients.filter((c) => {
    const cat = Array.isArray(c.expand?.categoria) ? c.expand.categoria[0] : c.expand?.categoria
    const isNovo = cat?.name?.toLowerCase() === 'novo'
    const created = new Date(c.created)
    return isNovo && created.getMonth() === currentMonth && created.getFullYear() === currentYear
  }).length

  const cards = [
    {
      title: 'Total de Atendimentos',
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
        { label: 'Moderados', count: moderateCount },
        { label: 'Críticos', count: criticalCount + monthCriticalCount },
        ...(isAdmin && oldAdminCount > 0 ? [{ label: 'Pgto Aberto', count: oldAdminCount }] : []),
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
      title: 'Novos no Mês',
      value: novosCount,
      icon: UserPlus,
      color: 'text-indigo-500 dark:text-indigo-400',
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-full">
      {cards.map((card, i) => (
        <Card
          key={i}
          className="hover:-translate-y-1 transition-transform duration-300 dark:bg-slate-900/50 dark:border-slate-800 w-full"
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
                {card.thresholds.map((t: any, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className={t.count > 0 ? 'text-red-500 font-medium' : ''}>
                      {t.label}: {t.count}
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
