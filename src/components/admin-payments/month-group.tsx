import { useMemo, useState, useContext } from 'react'
import { AdminPayment } from '@/types'
import { AdminPaymentsFilterContext } from '@/pages/PagamentosAdmin'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Copy, Plus } from 'lucide-react'
import { PaymentItem } from './payment-item'
import { cloneMonthPayments } from '@/services/admin_payments'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { startOfDay, addDays } from 'date-fns'

interface Props {
  mes: number
  ano: number
  items: AdminPayment[]
  onEditItem: (item: AdminPayment) => void
  onAddForOwner: (mes: number, ano: number, owner: string) => void
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function MonthGroup({ mes, ano, items, onEditItem, onAddForOwner }: Props) {
  const [cloning, setCloning] = useState(false)
  const statusFilter = useContext(AdminPaymentsFilterContext)

  const handleClone = async () => {
    try {
      setCloning(true)
      await cloneMonthPayments(mes, ano)
      toast.success('Ciclo repetido com sucesso!')
    } catch {
      toast.error('Erro ao repetir ciclo.')
    } finally {
      setCloning(false)
    }
  }

  const groupedByOwner = useMemo(() => {
    const map: Record<string, AdminPayment[]> = {}

    // ALWAYS USE items here to guarantee persistence of view for all items
    items.forEach((item) => {
      const owner = item.dono_pagamento || 'Sem Dono'
      if (!map[owner]) map[owner] = []
      map[owner].push(item)
    })

    Object.values(map).forEach((ownerItems) => {
      ownerItems.sort((a, b) => {
        const todayTime = startOfDay(new Date()).getTime()
        const tomorrowTime = addDays(startOfDay(new Date()), 1).getTime()

        const getPriority = (item: AdminPayment) => {
          if (item.status) return 4 // Paid
          if (item.data_notificacao) {
            const notifDate = startOfDay(
              new Date(item.data_notificacao.replace(' ', 'T')),
            ).getTime()
            if (notifDate <= todayTime) return 1 // Overdue
            if (notifDate === tomorrowTime) return 2 // Upcoming alert (exactly 1 day)
          }
          return 3 // Future/Other
        }

        const prioA = getPriority(a)
        const prioB = getPriority(b)

        if (prioA !== prioB) return prioA - prioB
        return (a.descricao || '').localeCompare(b.descricao || '')
      })
    })

    return Object.entries(map).sort(([ownerA, itemsA], [ownerB, itemsB]) => {
      const aAllPaid = itemsA.length > 0 && itemsA.every((i) => i.status)
      const bAllPaid = itemsB.length > 0 && itemsB.every((i) => i.status)

      if (aAllPaid && !bAllPaid) return 1
      if (!aAllPaid && bAllPaid) return -1

      const todayTime = startOfDay(new Date()).getTime()
      const aHasOverdue = itemsA.some(
        (i) =>
          !i.status &&
          !!i.data_notificacao &&
          startOfDay(new Date(i.data_notificacao.replace(' ', 'T'))).getTime() <= todayTime,
      )
      const bHasOverdue = itemsB.some(
        (i) =>
          !i.status &&
          !!i.data_notificacao &&
          startOfDay(new Date(i.data_notificacao.replace(' ', 'T'))).getTime() <= todayTime,
      )

      if (aHasOverdue && !bHasOverdue) return -1
      if (!aHasOverdue && bHasOverdue) return 1
      return ownerA.localeCompare(ownerB)
    })
  }, [items])

  const total = items.length
  const paid = items.filter((i) => i.status).length
  const isPaid = total > 0 && paid === total

  return (
    <div className="flex flex-col bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm max-h-full h-full w-full">
      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex flex-col">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {MONTH_NAMES[mes - 1]} {ano}
            {isPaid && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Mês concluído" />
            )}
          </h2>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {paid}/{total} pagos
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 gap-1.5 text-slate-600 dark:text-slate-300"
          onClick={handleClone}
          disabled={cloning}
          title="Repetir Ciclo para o próximo mês"
        >
          <Copy className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs">Repetir</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {groupedByOwner.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center">
            <span className="mb-2">Nenhum pagamento.</span>
            <Button variant="ghost" size="sm" onClick={() => onAddForOwner(mes, ano, '')}>
              Adicionar Item
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {groupedByOwner.map(([owner, ownerItems]) => {
              const ownerPaid = ownerItems.filter((i) => i.status).length

              const filteredOwnerItems = ownerItems.filter((i) => {
                if (statusFilter === 'pending') return !i.status
                if (statusFilter === 'paid') return i.status
                return true
              })

              if (filteredOwnerItems.length === 0 && statusFilter !== 'all') return null

              return (
                <div
                  key={owner}
                  className="flex flex-col rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm shrink-0 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-200 text-xs tracking-wide uppercase">
                        {owner}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-md font-bold',
                          ownerPaid === ownerItems.length
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                        )}
                      >
                        {ownerPaid}/{ownerItems.length}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 shrink-0 text-slate-500 hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md"
                      onClick={() => onAddForOwner(mes, ano, owner)}
                      title={`Adicionar para ${owner}`}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-2 space-y-2 scrollbar-thin bg-slate-50/50 dark:bg-slate-950">
                    {filteredOwnerItems.map((item) => (
                      <PaymentItem key={item.id} item={item} onEdit={onEditItem} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
