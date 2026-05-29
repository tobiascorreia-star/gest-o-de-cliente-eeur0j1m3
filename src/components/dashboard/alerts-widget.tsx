import { useAuth } from '@/hooks/use-auth'
import { useDashboard } from '@/hooks/use-dashboard'
import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, differenceInCalendarDays } from 'date-fns'
import { Clock, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, getClientAlertState } from '@/lib/utils'

export function AlertsWidget() {
  const { user: currentUser } = useAuth()
  const { clients, statuses, alertSettings } = useDashboard()
  const [notificationsList, setNotificationsList] = useState<any[]>([])

  useEffect(() => {
    if (currentUser?.role?.toLowerCase() === 'admin') {
      pb.collection('notifications')
        .getFullList({
          filter: "(type = 'password_reset' || type = 'atraso_cliente') && resolved = false",
          sort: '-created',
          expand: 'user,client',
        })
        .then(setNotificationsList)
        .catch(console.error)
    }
  }, [currentUser])

  useRealtime(
    'notifications',
    (e) => {
      if (
        e.action === 'create' &&
        (e.record.type === 'password_reset' || e.record.type === 'atraso_cliente') &&
        !e.record.resolved
      ) {
        setNotificationsList((prev) => [e.record, ...prev])
      } else if (e.action === 'delete') {
        setNotificationsList((prev) => prev.filter((r) => r.id !== e.record.id))
      } else if (e.action === 'update') {
        if (e.record.type === 'password_reset' || e.record.type === 'atraso_cliente') {
          if (e.record.resolved) {
            setNotificationsList((prev) => prev.filter((r) => r.id !== e.record.id))
          } else {
            setNotificationsList((prev) => {
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

  const handleResolveNotification = async (id: string) => {
    try {
      await pb.collection('notifications').update(id, { resolved: true })
    } catch (e) {
      console.error(e)
    }
  }

  if (currentUser?.role?.toLowerCase() !== 'admin') {
    return null
  }

  const now = new Date()
  let moderateCount = 0
  let criticalCount = 0
  let oldAdminCount = 0
  let monthCriticalCount = 0
  let monthWarningCount = 0

  const oldClients: any[] = []
  const criticalClients: any[] = []

  clients.forEach((c) => {
    const { isCritical, isModerate, isOldAdmin, isMonthCritical, isMonthWarning } =
      getClientAlertState(c, alertSettings, true)

    if (isMonthCritical) monthCriticalCount++
    if (isMonthWarning) monthWarningCount++
    if (isCritical) criticalCount++
    if (isModerate) moderateCount++
    if (isOldAdmin) oldAdminCount++

    if (isCritical || isMonthCritical) {
      criticalClients.push(c)
    } else if (isModerate || isOldAdmin || isMonthWarning) {
      oldClients.push(c)
    }
  })

  const agingClients = [...criticalClients, ...oldClients].sort((a, b) => {
    const dateA = a.updated ? new Date(a.updated).getTime() : new Date(a.created).getTime()
    const dateB = b.updated ? new Date(b.updated).getTime() : new Date(b.created).getTime()
    return dateA - dateB
  })

  const pendingResets = notificationsList.filter((n) => n.type === 'password_reset')
  const delayedClients = notificationsList.filter((n) => n.type === 'atraso_cliente')

  return (
    <div className="space-y-4 mt-4">
      {monthCriticalCount > 0 && (
        <Card className="border-border/50 shadow-sm border-l-4 border-l-destructive bg-destructive/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light flex items-center gap-2 text-destructive">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
              </span>
              <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
              Crítico — Pagamento Atrasado do Mês Anterior
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Existem <strong>{monthCriticalCount}</strong> pagamento(s) com status 'aberto' de
              meses anteriores.
            </p>
          </CardContent>
        </Card>
      )}

      {monthWarningCount > 0 && (
        <Card className="border-border/50 shadow-sm border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
              <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />A Pagar — Fim de Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Existem <strong>{monthWarningCount}</strong> pagamento(s) com status 'aberto' próximos
              do vencimento (fim do mês).
            </p>
          </CardContent>
        </Card>
      )}

      {criticalCount > 0 && (
        <Card className="border-border/50 shadow-sm border-l-4 border-l-destructive bg-destructive/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
              Atendimentos Críticos — Acima de {alertSettings?.critical_days ?? 30} dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive/80 dark:text-red-400">
              Existem <strong>{criticalCount}</strong> atendimento(s) em estado crítico.
            </p>
          </CardContent>
        </Card>
      )}

      {moderateCount > 0 && (
        <Card className="border-border/50 shadow-sm border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
              Atendimentos Aguardando — Acima de {alertSettings?.old_days ?? 15} dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Existem <strong>{moderateCount}</strong> atendimento(s) em estado moderado.
            </p>
          </CardContent>
        </Card>
      )}

      {oldAdminCount > 0 && (
        <Card className="border-border/50 shadow-sm border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light flex items-center gap-2 text-blue-600 dark:text-blue-500">
              <Clock className="w-4 h-4" strokeWidth={1.5} />
              Pagamentos Abertos Antigos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Existem <strong>{oldAdminCount}</strong> pagamento(s) aberto(s) há mais de{' '}
              {alertSettings?.old_admin_days ?? 15} dias.
            </p>
          </CardContent>
        </Card>
      )}

      {delayedClients.length > 0 && (
        <Card className="border-border/50 shadow-sm border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
              Atenção: Clientes Atrasados ({delayedClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {delayedClients.slice(0, 5).map((req) => {
                const clientName = req.expand?.client?.razao_social || 'Cliente não encontrado'
                return (
                  <div
                    key={req.id}
                    className="flex items-center justify-between bg-background p-3 rounded-lg border shadow-sm"
                  >
                    <div>
                      <p className="font-medium text-sm text-red-700 dark:text-red-400">
                        {clientName}
                      </p>
                      <p className="text-[11px] font-light text-muted-foreground mt-0.5">
                        Detectado em {format(new Date(req.created), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveNotification(req.id)}
                      className="gap-2 font-light text-xs hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.25} />
                      Resolver
                    </Button>
                  </div>
                )
              })}
              {delayedClients.length > 5 && (
                <p className="text-xs text-center text-muted-foreground pt-2">
                  + {delayedClients.length - 5} outros atrasos não resolvidos.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {pendingResets.length > 0 && (
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
                      onClick={() => handleResolveNotification(req.id)}
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

      <Card
        className={cn(
          'border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border-l-4 overflow-hidden',
          criticalClients.length > 0 ? 'border-l-destructive' : 'border-l-amber-400',
        )}
      >
        <CardHeader className="bg-white/50 dark:bg-slate-900/50 pb-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle
            className={cn(
              'text-sm font-light flex items-center gap-2',
              criticalClients.length > 0
                ? 'text-destructive'
                : 'text-slate-700 dark:text-slate-200',
            )}
          >
            <Clock
              className={cn(
                'w-4 h-4',
                criticalClients.length > 0 ? 'text-destructive' : 'text-amber-500',
              )}
              strokeWidth={1.25}
            />
            Aviso
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {agingClients.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8 opacity-50" strokeWidth={1.25} />
              <p className="text-sm font-light">Tudo em dia!</p>
              <p className="text-xs font-light opacity-80 text-center px-4">
                Nenhum atendimento antigo ou em estado crítico.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-foreground">
                Existem <strong>{oldClients.length}</strong> atendimentos antigos e{' '}
                <strong>{criticalClients.length}</strong> atendimentos em estado crítico.
              </p>
              {agingClients.slice(0, 5).map((alert) => {
                const isCritical = criticalClients.includes(alert)
                return (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-light text-sm">{alert.razao_social}</p>
                      <p className="text-[11px] font-light text-muted-foreground mt-0.5">
                        Atualizado em{' '}
                        {format(
                          alert.updated ? new Date(alert.updated) : new Date(alert.created),
                          'dd/MM/yyyy',
                        )}{' '}
                        (
                        {differenceInCalendarDays(
                          now,
                          alert.updated ? new Date(alert.updated) : new Date(alert.created),
                        )}{' '}
                        dias)
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const state = getClientAlertState(alert, alertSettings, true)
                        if (state.isMonthCritical || state.isCritical) {
                          return (
                            <Badge variant="destructive" className="font-light text-[10px]">
                              Crítica
                            </Badge>
                          )
                        }
                        if (state.isMonthWarning) {
                          return (
                            <Badge
                              variant="outline"
                              className="font-light text-[10px] border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-500"
                            >
                              A Pagar
                            </Badge>
                          )
                        }
                        return (
                          <Badge
                            variant="outline"
                            className="font-light text-[10px] border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-500"
                          >
                            Antiga
                          </Badge>
                        )
                      })()}
                    </div>
                  </div>
                )
              })}
              {agingClients.length > 5 && (
                <p className="text-xs text-center text-muted-foreground pt-2">
                  + {agingClients.length - 5} outros atendimentos antigos/críticos.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
