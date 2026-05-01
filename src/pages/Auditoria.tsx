import { useApp } from '@/contexts/app-context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'

const Auditoria = () => {
  const { audit } = useApp()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Auditoria de Sistema</h2>
        <p className="text-muted-foreground text-sm">
          Registro de segurança e alterações críticas.
        </p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Alvo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audit.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}
                </TableCell>
                <TableCell className="font-medium">{log.userName}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell className="text-muted-foreground">{log.target}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default Auditoria
