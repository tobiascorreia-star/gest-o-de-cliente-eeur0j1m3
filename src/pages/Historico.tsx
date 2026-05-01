import { useApp } from '@/contexts/app-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const Historico = () => {
  const { history, clients, users } = useApp()

  const enrichedHistory = history
    .map((h) => ({
      ...h,
      clientName: clients.find((c) => c.id === h.clientId)?.razaoSocial || 'Cliente Desconhecido',
      userName: users.find((u) => u.id === h.userId)?.name || 'Sistema',
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Histórico de Interações</h2>
        <p className="text-muted-foreground text-sm">
          Linha do tempo de todas as ações realizadas nos clientes.
        </p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {enrichedHistory.map((log) => (
              <div
                key={log.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">Cliente: {log.clientName}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm">{log.userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Historico
