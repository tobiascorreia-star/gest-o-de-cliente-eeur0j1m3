import { useApp } from '@/contexts/app-context'
import { useDashboard } from '@/hooks/use-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { differenceInDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, KeyRound, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AlertsWidget() {
  const {
    currentUser,
    passwordResetRequests = [],
    resolvePasswordReset = () => {},
  } = useApp?.() || {}
  const { clients, statuses, alertSettings } = useDashboard()

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

  const pendingResets = passwordResetRequests.filter((r: any) => r.status === 'pending')

  return (
    <div className="space-y-4 mt-4">
      {currentUser?.role?.toLowerCase() === 'admin' && pendingResets.length > 0 && (
        <Card className="border-border/50 shadow-sm border-l-4 border-l-primary bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2 text-primary">
              <KeyRound className="w-5 h-5" />
              Solicitações de Redefinição de Senha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingResets.map((req: any) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between bg-background p-3 rounded-lg border shadow-sm"
                >
                  <div>
                    <p className="font-medium text-sm">Operador: {req.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Solicitado em {format(new Date(req.timestamp), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => resolvePasswordReset(req.id)} className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Marcar como Resolvido
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 shadow-sm border-l-4 border-l-emerald-500 overflow-hidden">
        <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 pb-4 border-b border-border/50">
          <CardTitle className="text-base font-medium flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
            <Clock className="w-5 h-5" />
            Alertas de Pendências
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {alerts.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8 opacity-50" />
              <p className="text-sm font-medium">Tudo em dia!</p>
              <p className="text-xs opacity-80">Nenhuma pendência antiga ou crítica encontrada.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-sm">{alert.razao_social}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cadastrado em{' '}
                      {format(new Date(alert.created), "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      {alert.days} dias
                    </span>
                    <Badge
                      variant="secondary"
                      className={
                        alert.severity === 'critical'
                          ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
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
