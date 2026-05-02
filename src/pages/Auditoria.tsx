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
import { Trash2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function Auditoria() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchLogs = async () => {
    try {
      setError(null)
      const records = await pb.collection('audit_logs').getFullList({
        sort: '-created',
        expand: 'user',
      })
      setLogs(records)
    } catch (err: any) {
      console.error(err)
      setError(
        'Não foi possível carregar os registros de auditoria. Verifique sua conexão ou permissões.',
      )
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

  const handleClearAudit = async () => {
    try {
      setLoading(true)
      await pb.send('/backend/v1/audit/clear', {
        method: 'POST',
      })
      toast({
        title: 'Auditoria limpa',
        description: 'Todos os registros foram removidos com sucesso.',
      })
      await fetchLogs()
    } catch (err: any) {
      toast({
        title: 'Erro ao limpar auditoria',
        description: err.message || 'Não foi possível limpar os registros.',
        variant: 'destructive',
      })
      setLoading(false)
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
            <Button variant="destructive" disabled={loading || logs.length === 0}>
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

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
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
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-[120px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[200px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[180px]" />
                    </TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    Nenhum registro de auditoria encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.created ? format(new Date(log.created), 'dd/MM/yyyy HH:mm') : '-'}
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
      )}
    </div>
  )
}
