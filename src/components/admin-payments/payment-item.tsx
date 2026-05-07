import { AdminPayment } from '@/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateAdminPayment, deleteAdminPayment } from '@/services/admin_payments'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Props {
  item: AdminPayment
  onEdit: (item: AdminPayment) => void
}

export function PaymentItem({ item, onEdit }: Props) {
  const handleToggle = async () => {
    try {
      const newStatus = !item.status
      const data_pagamento_realizado = newStatus ? new Date().toISOString() : ''
      await updateAdminPayment(item.id, {
        status: newStatus,
        data_pagamento_realizado,
      })
    } catch (err) {
      toast.error('Erro ao atualizar status')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Deseja excluir este pagamento?')) return
    try {
      await deleteAdminPayment(item.id)
      toast.success('Excluído com sucesso')
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  return (
    <div className="group flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
      <Checkbox
        checked={item.status}
        onCheckedChange={handleToggle}
        className="mt-1 transition-all"
      />
      <div className={cn('flex-1 min-w-0 transition-opacity', item.status && 'opacity-60')}>
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'text-sm font-medium text-slate-900 dark:text-slate-100',
              item.status && 'line-through text-slate-500',
            )}
          >
            {item.descricao}
          </p>
          {item.status && item.data_pagamento_realizado && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-medium">
              <Clock className="w-3 h-3" />
              {format(new Date(item.data_pagamento_realizado.replace(' ', 'T')), 'HH:mm')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>
            Vence: {format(new Date(item.data_notificacao.replace(' ', 'T')), 'dd/MM/yyyy')}
          </span>
          {item.observacao && (
            <>
              <span>•</span>
              <span className="truncate max-w-[200px]">{item.observacao}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-primary"
          onClick={() => onEdit(item)}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
