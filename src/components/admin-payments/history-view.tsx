import { AdminPayment } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface Props {
  items: AdminPayment[]
}

export function HistoryView({ items }: Props) {
  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
          <TableRow>
            <TableHead>Mês de Referência</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="group">
              <TableCell className="capitalize font-medium text-slate-600 dark:text-slate-300">
                {format(new Date(item.reference_month.replace(' ', 'T')), 'MMMM yyyy', {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell className="text-slate-600 dark:text-slate-400">
                {format(new Date(item.due_date.replace(' ', 'T')), 'dd/MM/yyyy')}
              </TableCell>
              <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                {item.name}
              </TableCell>
              <TableCell>
                {item.status ? (
                  <Badge
                    variant="default"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
                  >
                    Pago
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    Pendente
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right text-slate-600 dark:text-slate-400">
                {item.value
                  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      item.value,
                    )
                  : '-'}
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                Nenhum registro encontrado no histórico.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
