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

  const mockAudit =
    audit.length > 0
      ? audit
      : [
          {
            id: 'm1',
            timestamp: new Date().getTime() - 1000 * 60 * 5,
            userName: 'Admin',
            action: 'Login no sistema',
            target: 'Auth',
          },
          {
            id: 'm2',
            timestamp: new Date().getTime() - 1000 * 60 * 60,
            userName: 'Tobias Correia',
            action: 'Atualização de cliente',
            target: 'Cliente ID: 123',
          },
          {
            id: 'm3',
            timestamp: new Date().getTime() - 1000 * 60 * 60 * 24,
            userName: 'Sistema',
            action: 'Backup automático',
            target: 'Database',
          },
        ]

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
            {mockAudit.map((log) => (
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
