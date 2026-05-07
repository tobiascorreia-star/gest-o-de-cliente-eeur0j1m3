import { useState } from 'react'
import { format, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AdminPayment } from '@/types'
import {
  createAdminPayment,
  updateAdminPayment,
  deleteAdminPayment,
} from '@/services/admin_payments'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Copy, Plus, Trash2, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  monthDate: Date
  items: AdminPayment[]
  onClone: (date: Date) => void
}

export function MonthColumn({ monthDate, items, onClone }: Props) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [date, setDate] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !date || !user) return
    try {
      const refMonth = startOfMonth(monthDate).toISOString()
      await createAdminPayment({
        name,
        due_date: new Date(date + 'T12:00:00').toISOString(),
        reference_month: refMonth,
        status: false,
        admin: user.id,
      })
      setName('')
      setDate('')
      toast.success('Adicionado com sucesso')
    } catch (err) {
      toast.error('Erro ao adicionar pagamento')
    }
  }

  const toggleStatus = async (item: AdminPayment) => {
    try {
      await updateAdminPayment(item.id, { status: !item.status })
    } catch (err) {
      toast.error('Erro ao atualizar status')
    }
  }

  return (
    <div className="w-80 shrink-0 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between">
        <h3 className="font-semibold capitalize text-slate-800 dark:text-slate-100">
          {format(monthDate, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onClone(monthDate)}
          title="Repetir para próximo mês"
          className="h-8 w-8 text-slate-500 hover:text-primary"
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-3 flex-1 overflow-y-auto space-y-2 min-h-[300px]">
        {items.map((item) => (
          <div
            key={item.id}
            className="group p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg shadow-sm flex items-start gap-3 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
          >
            <Checkbox
              checked={item.status}
              onCheckedChange={() => toggleStatus(item)}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-medium truncate transition-all',
                  item.status
                    ? 'line-through text-muted-foreground'
                    : 'text-slate-900 dark:text-slate-100',
                )}
              >
                {item.name}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <CalendarIcon className="w-3 h-3" />
                {format(new Date(item.due_date.replace(' ', 'T')), 'dd/MM/yyyy')}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => deleteAdminPayment(item.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center p-8 text-sm text-muted-foreground border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
            Nenhum pagamento
          </div>
        )}
      </div>

      <form
        onSubmit={handleAdd}
        className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2"
      >
        <Input
          placeholder="Nome do pagamento..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 text-sm"
          required
        />
        <div className="flex gap-2">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 text-sm flex-1"
            required
          />
          <Button type="submit" size="sm" className="h-9 shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
