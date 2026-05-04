import { useEffect, useState } from 'react'
import { getAuditLogs } from '@/services/audit'
import { AuditLog } from '@/types'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/ui/skeleton'

export default function Historico() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    try {
      const data = await getAuditLogs()
      setLogs(data)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  useRealtime('audit_logs', () => {
    fetchLogs()
  })

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6 px-4">
        <div>
          <Skeleton className="w-64 h-8 mb-2" />
          <Skeleton className="w-80 h-4" />
        </div>
        <div className="space-y-4">
          <Skeleton className="w-full h-24" />
          <Skeleton className="w-full h-24" />
          <Skeleton className="w-full h-24" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6 px-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Histórico de Interações</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Linha do tempo de todas as ações realizadas nos clientes.
        </p>
      </div>

      {logs.length === 0 ? (
        <Card className="border-border/50 bg-muted/20 shadow-sm">
          <CardContent className="p-12 text-center text-muted-foreground">
            Nenhuma interação registrada no momento.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 border-l-2 border-border/50 ml-3 pl-6 relative">
          {logs.map((log) => (
            <div key={log.id} className="relative group">
              <span className="absolute -left-[41px] flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-border group-hover:border-primary transition-colors ring-4 ring-background">
                <Avatar className="w-6 h-6">
                  <AvatarImage
                    src={
                      log.expand?.user?.avatar
                        ? pb.files.getURL(log.expand.user, log.expand.user.avatar)
                        : undefined
                    }
                  />
                  <AvatarFallback className="text-[10px] font-medium">
                    {log.expand?.user?.name?.substring(0, 2).toUpperCase() || 'S'}
                  </AvatarFallback>
                </Avatar>
              </span>
              <div className="flex flex-col gap-2 p-4 rounded-lg border bg-card shadow-sm hover:border-border/80 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                  <h4 className="text-sm font-semibold text-foreground">{log.action}</h4>
                  <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full w-fit">
                    {format(new Date(log.created), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
                {log.details && (
                  <p className="text-sm text-muted-foreground/90 leading-relaxed">{log.details}</p>
                )}
                <div className="text-xs font-medium text-primary mt-1">
                  Por: {log.expand?.user?.name || 'Sistema'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
