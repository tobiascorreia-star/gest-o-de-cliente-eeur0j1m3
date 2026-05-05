import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { getAuditLogs } from '@/services/audit'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { AuditLog } from '@/types'

export default function Auditoria() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const { toast } = useToast()

  const loadLogs = async () => {
    try {
      const data = await getAuditLogs()
      setLogs(data)
    } catch (error) {
      console.error('Failed to load audit logs', error)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  useRealtime('audit_logs', () => {
    loadLogs()
  })

  const handleClearAudit = async () => {
    try {
      // Exclui os registros um a um pois o PocketBase SDK não suporta deleção em massa nativamente no frontend
      await Promise.all(logs.map((log) => pb.collection('audit_logs').delete(log.id)))
      toast({
        title: 'Auditoria limpa',
        description: 'Audit logs cleared successfully',
      })
      loadLogs()
    } catch (error) {
      toast({
        title: 'Erro ao limpar auditoria',
        description: 'Ocorreu um erro ao tentar remover os registros.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Auditoria de Sistema</h2>
          <p className="text-muted-foreground text-sm">
            Registro de segurança e alterações críticas.
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={logs.length === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Auditoria
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todos os registros de auditoria serão apagados
                permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleClearAudit}
              >
                Sim, limpar tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[180px]">Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Alvo/Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  Nenhum registro de auditoria encontrado.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.created && !isNaN(new Date(log.created).getTime())
                      ? format(new Date(log.created), 'dd/MM/yyyy HH:mm')
                      : '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.expand?.user?.name || log.expand?.user?.email || 'Sistema'}
                  </TableCell>
                  <TableCell>{log.action || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{log.details || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
