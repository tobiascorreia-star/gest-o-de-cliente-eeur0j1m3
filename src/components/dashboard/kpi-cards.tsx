import { Users, AlertCircle, CheckCircle2, UserPlus, TrendingUp } from 'lucide-react'
import { useDashboard } from '@/hooks/use-dashboard'
import { useAuth } from '@/hooks/use-auth'
import { getClientAlertState } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: number | string
  icon: React.ElementType
  colorClass: string
  bgClass: string
  borderClass: string
  sub?: React.ReactNode
  loading?: boolean
}

function KpiCard({ title, value, icon: Icon, colorClass, bgClass, borderClass, sub, loading }: KpiCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden group',
        bgClass,
        borderClass,
      )}
    >
      {/* Glow effect */}
      <div className={cn('absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity', colorClass.replace('text-', 'bg-'))} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate mb-3">{title}</p>
          <div className={cn('text-3xl font-bold tracking-tight', colorClass)}>
            {loading ? (
              <div className="h-8 w-16 rounded-lg bg-muted/50 animate-pulse" />
            ) : (
              value
            )}
          </div>
          {sub && <div className="mt-2">{sub}</div>}
        </div>
        <div className={cn('shrink-0 p-2.5 rounded-xl', bgClass, 'border', borderClass)}>
          <Icon className={cn('w-5 h-5', colorClass)} />
        </div>
      </div>
    </div>
  )
}

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
        c, alertSettings, isAdmin,
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
    const d = new Date(dateStr)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }).length

  const novosCount = clients.filter((c) => {
    const cat = Array.isArray(c.expand?.categoria) ? c.expand.categoria[0] : c.expand?.categoria
    const isNovo = cat?.name?.toLowerCase() === 'novo'
    const created = new Date(c.created)
    return isNovo && created.getMonth() === currentMonth && created.getFullYear() === currentYear
  }).length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      <KpiCard
        title="Total de Atendimentos"
        value={total}
        icon={Users}
        colorClass="text-blue-500 dark:text-cyan-400"
        bgClass="bg-blue-500/5 dark:bg-cyan-400/5"
        borderClass="border-blue-500/15 dark:border-cyan-400/20"
        sub={
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <TrendingUp className="w-3 h-3 text-blue-500 dark:text-cyan-400" />
            <span>em aberto no sistema</span>
          </div>
        }
        loading={loading}
      />

      <KpiCard
        title="Pendências Críticas"
        value={pending}
        icon={AlertCircle}
        colorClass={pending > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-muted-foreground'}
        bgClass="bg-amber-500/5 dark:bg-amber-400/5"
        borderClass={pending > 0 ? 'border-amber-500/20 dark:border-amber-400/20' : 'border-border/50'}
        sub={
          !loading && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
              {moderateCount > 0 && (
                <span className="text-amber-500 font-medium">Moderados: {moderateCount}</span>
              )}
              {(criticalCount + monthCriticalCount) > 0 && (
                <span className="text-red-500 font-medium">Críticos: {criticalCount + monthCriticalCount}</span>
              )}
              {isAdmin && oldAdminCount > 0 && (
                <span className="text-orange-500 font-medium">Pgto Aberto: {oldAdminCount}</span>
              )}
              {pending === 0 && <span className="text-emerald-500">Tudo em dia ✓</span>}
            </div>
          )
        }
        loading={loading}
      />

      <KpiCard
        title="Concluídos no Mês"
        value={completedThisMonth}
        icon={CheckCircle2}
        colorClass="text-emerald-500 dark:text-emerald-400"
        bgClass="bg-emerald-500/5 dark:bg-emerald-400/5"
        borderClass="border-emerald-500/15 dark:border-emerald-400/20"
        sub={
          <div className="text-[11px] text-muted-foreground">
            atendimentos finalizados
          </div>
        }
        loading={loading}
      />

      <KpiCard
        title="Novos no Mês"
        value={novosCount}
        icon={UserPlus}
        colorClass="text-violet-500 dark:text-violet-400"
        bgClass="bg-violet-500/5 dark:bg-violet-400/5"
        borderClass="border-violet-500/15 dark:border-violet-400/20"
        sub={
          <div className="text-[11px] text-muted-foreground">
            cadastrados este mês
          </div>
        }
        loading={loading}
      />
    </div>
  )
}
