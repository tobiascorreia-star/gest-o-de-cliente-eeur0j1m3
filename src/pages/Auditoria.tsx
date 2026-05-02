import { useState } from 'react'
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

const MOCK_AUDIT_LOGS = [
  {
    id: '1',
    created: new Date().toISOString(),
    action: 'Login no sistema',
    details: 'Autenticação e Sessão',
    expand: { user: { name: 'Administrador' } },
  },
  {
    id: '2',
    created: new Date().toISOString(),
    action: 'Atualização de cliente',
    details: 'Cliente ID: 12345',
    expand: { user: { name: 'Administrador' } },
  },
  {
    id: '3',
    created: new Date().toISOString(),
    action: 'Backup automático',
    details: 'Database rotina semanal',
    expand: null,
  },
]

export default function Auditoria() {
  const [logs, setLogs] = useState<any[]>(MOCK_AUDIT_LOGS)
  const { toast } = useToast()

  const handleClearAudit = () => {
    setLogs([])
    toast({
      title: 'Auditoria limpa',
      description: 'Todos os registros foram removidos com sucesso.',
    })
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
