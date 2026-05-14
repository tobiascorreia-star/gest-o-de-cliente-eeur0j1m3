import { useAuth } from '@/hooks/use-auth'
import { useDashboard } from '@/hooks/use-dashboard'
import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AlertsWidget() {
  const { user: currentUser } = useAuth()
  const { clients, statuses } = useDashboard()
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

  const now = new Date()
  const currentMonthEnd = endOfMonth(now)

  const alerts = clients
    .filter((c) => {
      const statusName = statuses.find((s) => s.id === c.status)?.name?.toUpperCase() || ''
      if (statusName === 'BAIXA' || statusName === 'CONCLUÍDO' || statusName === 'CONCLUIDO')
        return false

      const createdDate = new Date(c.created)
      if (
        createdDate.getMonth() !== currentMonthEnd.getMonth() ||
        createdDate.getFullYear() !== currentMonthEnd.getFullYear()
      ) {
        return false
      }

      return currentMonthEnd.getDate() - createdDate.getDate() <= 5
    })
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    .slice(0, 6)

  const pendingResets = notificationsList.filter((n) => n.type === 'password_reset')
  const delayedClients = notificationsList.filter((n) => n.type === 'atraso_cliente')

  if (currentUser?.role?.toLowerCase() !== 'admin') {
    return null
  }

  return (
    <div className="space-y-4 mt-4">
      {delayedClients.length > 0 && (
        <Card className="border-border/50 shadow-sm border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-light flex items-center gap-2 text-red-600 dark:text-red-400">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
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
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
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

      <Card className="border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border-l-4 border-l-amber-400 overflow-hidden">
        <CardHeader className="bg-white/50 dark:bg-slate-900/50 pb-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-light flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Clock className="w-4 h-4 text-amber-500" strokeWidth={1.25} />
            Alertas de Pendências (Fim de Mês)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {alerts.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8 opacity-50" strokeWidth={1.25} />
              <p className="text-sm font-light">Tudo em dia!</p>
              <p className="text-xs font-light opacity-80 text-center px-4">
                Nenhum item pendente criado nos últimos 5 dias do mês atual.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-light text-muted-foreground pb-2">
                Atenção: Itens criados nos últimos 5 dias do mês atual.
              </p>
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
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 font-light text-[10px]"
                    >
                      Fim de Mês
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
