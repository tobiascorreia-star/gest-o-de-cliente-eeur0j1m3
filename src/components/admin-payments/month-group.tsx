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
    <div className="mb-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {MONTH_NAMES[mes - 1]} {ano}
          </h2>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {paid}/{total} pagos
          </span>
        </div>
        {!isPaid && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-slate-600 dark:text-slate-300"
            onClick={handleClone}
            disabled={cloning}
          >
            <Copy className="w-4 h-4" />
            Repetir Ciclo
          </Button>
        )}
      </div>

      {groupedByOwner.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Nenhum pagamento registrado para este mês.
        </div>
      ) : (
        <Accordion
          type="multiple"
          defaultValue={groupedByOwner.map((g) => g[0])}
          className="w-full"
        >
          {groupedByOwner.map(([owner, ownerItems]) => (
            <AccordionItem
              key={owner}
              value={owner}
              className="border-b last:border-0 border-slate-100 dark:border-slate-800"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{owner}</span>
                  <span className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {ownerItems.length}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-1">
                <div className="space-y-1 mb-3">
                  {ownerItems.map((item) => (
                    <PaymentItem key={item.id} item={item} onEdit={onEditItem} />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-slate-500 hover:text-primary w-full justify-start border border-dashed border-slate-200 dark:border-slate-800"
                  onClick={(e) => {
                    e.preventDefault()
                    onAddForOwner(mes, ano, owner)
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Adicionar para {owner}
                </Button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
