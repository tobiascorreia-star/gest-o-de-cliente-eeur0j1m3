import { useMemo, useState } from 'react'
import { AdminPayment } from '@/types'
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
    items.forEach((item) => {
      const owner = item.dono_pagamento || 'Sem Dono'
      if (!map[owner]) map[owner] = []
      map[owner].push(item)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
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
          <Accordion
            type="multiple"
            defaultValue={groupedByOwner.map((g) => g[0])}
            className="w-full space-y-3"
          >
            {groupedByOwner.map(([owner, ownerItems]) => {
              const ownerPaid = ownerItems.filter((i) => i.status).length
              return (
                <AccordionItem key={owner} value={owner} className="border-none bg-transparent">
                  <div className="flex items-center justify-between group">
                    <AccordionTrigger className="px-1 py-2 hover:no-underline flex-1 justify-start gap-2 text-sm">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-tight text-xs">
                        {owner}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                          ownerPaid === ownerItems.length
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                        )}
                      >
                        {ownerPaid}/{ownerItems.length}
                      </span>
                    </AccordionTrigger>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddForOwner(mes, ano, owner)
                      }}
                      title={`Adicionar para ${owner}`}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <AccordionContent className="pb-1 pt-0">
                    <div className="space-y-2">
                      {ownerItems.map((item) => (
                        <PaymentItem key={item.id} item={item} onEdit={onEditItem} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </div>
    </div>
  )
}
