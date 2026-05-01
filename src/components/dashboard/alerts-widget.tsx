import { useApp } from '@/contexts/app-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { differenceInDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, KeyRound, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AlertsWidget() {
  const {
    currentUser,
    clients,
    statusList,
    alertConfig,
    passwordResetRequests,
    resolvePasswordReset,
  } = useApp()
  const baixaStatusId = statusList.find((s) => s.name === 'Baixa')?.id

  const alerts = clients
    .filter((c) => c.statusId !== baixaStatusId)
    .map((c) => {
      const days = differenceInDays(new Date(), new Date(c.dataCadastro))
      let severity: 'none' | 'moderate' | 'critical' = 'none'
      if (days >= alertConfig.criticalDays) severity = 'critical'
      else if (days >= alertConfig.moderateDays) severity = 'moderate'

      return { ...c, days, severity }
    })
    .filter((c) => c.severity !== 'none')
    .sort((a, b) => b.days - a.days)
    .slice(0, 6)

  const pendingResets = passwordResetRequests.filter((r) => r.status === 'pending')

  return (
    <div className="space-y-4 mt-4">
      {currentUser?.role === 'Admin' && pendingResets.length > 0 && (
        <Card className="border-border/50 shadow-sm border-l-4 border-l-primary bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2 text-primary">
              <KeyRound className="w-5 h-5" />
              Solicitações de Redefinição de Senha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingResets.map((req) => (
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

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Pendências Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nenhuma pendência crítica ou moderada encontrada.
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-sm">{alert.razaoSocial}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cadastrado em{' '}
                      {format(new Date(alert.dataCadastro), "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      {alert.days} dias
                    </span>
                    <Badge
                      variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                      className={
                        alert.severity === 'moderate'
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-500'
                          : ''
                      }
                    >
                      {alert.severity === 'critical' ? 'Crítico' : 'Moderado'}
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
