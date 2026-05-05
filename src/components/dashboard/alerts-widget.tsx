import { useApp } from '@/contexts/app-context'
import { useDashboard } from '@/hooks/use-dashboard'
import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { AuditLog } from '@/types'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { differenceInDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, KeyRound, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AlertsWidget() {
  const { currentUser } = useApp?.() || {}
  const { clients, statuses, alertSettings } = useDashboard()
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

  useRealtime(
    'notifications',
    (e) => {
      if (e.action === 'create' && e.record.type === 'password_reset' && !e.record.resolved) {
        setResetRequests((prev) => [e.record, ...prev])
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
    currentUser?.role?.toLowerCase() === 'admin',
  )

  const handleResolveReset = async (id: string) => {
    try {
      await pb.collection('notifications').update(id, { resolved: true })
    } catch (e) {
      console.error(e)
    }
  }

  const baixaStatusId = statuses.find((s) => s.name.toLowerCase() === 'baixa')?.id

  const alerts = clients
    .filter((c) => c.status !== baixaStatusId)
    .map((c) => {
      const days = differenceInDays(new Date(), new Date(c.created))
      let severity: 'none' | 'old' | 'critical' = 'none'
      if (days >= alertSettings.critical_days) severity = 'critical'
      else if (days >= alertSettings.old_days) severity = 'old'

      return { ...c, days, severity }
    })
    .filter((c) => c.severity !== 'none')
    .sort((a, b) => b.days - a.days)
    .slice(0, 6)

  const pendingResets = resetRequests

  return (
    <div className="space-y-4 mt-4">
      {currentUser?.role?.toLowerCase() === 'admin' && pendingResets.length > 0 && (
        <Card className="border-border/50 shadow-sm border-l-4 border-l-primary bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light flex items-center gap-2 text-primary">
              <KeyRound className="w-4 h-4" strokeWidth={1.25} />
              Solicitações de Redefinição de Senha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingResets.map((req) => {
                const userEmail = req.expand?.user?.email || 'Desconhecido'
                const userName = req.expand?.user?.name
                  ? `${req.expand.user.name} (${userEmail})`
                  : userEmail
                return (
                  <div
                    key={req.id}
                    className="flex items-center justify-between bg-background p-3 rounded-lg border shadow-sm"
                  >
                    <div>
                      <p className="font-light text-sm">Operador: {userName}</p>
                      <p className="text-[11px] font-light text-muted-foreground mt-0.5">
                        Solicitado em {format(new Date(req.created), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveReset(req.id)}
                      className="gap-2 font-light text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.25} />
                      Resolvido
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border-l-4 border-l-emerald-400 overflow-hidden">
        <CardHeader className="bg-white/50 dark:bg-slate-900/50 pb-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-light flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Clock className="w-4 h-4 text-emerald-500" strokeWidth={1.25} />
            Alertas de Pendências
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {alerts.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8 opacity-50" strokeWidth={1.25} />
              <p className="text-sm font-light">Tudo em dia!</p>
              <p className="text-xs font-light opacity-80">
                Nenhuma pendência antiga ou crítica encontrada.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-light text-sm">{alert.razao_social}</p>
                    <p className="text-[11px] font-light text-muted-foreground mt-0.5">
                      Cadastrado em{' '}
                      {format(new Date(alert.created), "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-light text-muted-foreground">
                      {alert.days} dias
                    </span>
                    <Badge
                      variant="secondary"
                      className={
                        alert.severity === 'critical'
                          ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 font-light text-[10px]'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 font-light text-[10px]'
                      }
                    >
                      {alert.severity === 'critical' ? 'Crítico' : 'Antiga'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
