import { useState, useEffect, useMemo } from 'react'
import { startOfMonth, addMonths, isSameMonth } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MonthColumn } from '@/components/admin-payments/month-column'
import { HistoryView } from '@/components/admin-payments/history-view'
import { AdminPayment } from '@/types'
import { getAdminPayments, cloneMonthPayments } from '@/services/admin_payments'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'
import { Wallet } from 'lucide-react'

export default function PagamentosAdmin() {
  const [payments, setPayments] = useState<AdminPayment[]>([])

  const loadData = async () => {
    try {
      const data = await getAdminPayments()
      setPayments(data)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('admin_payments', () => {
    loadData()
  })

  const handleClone = async (date: Date) => {
    try {
      await cloneMonthPayments(startOfMonth(date).toISOString())
      toast.success('Mês repetido com sucesso!')
      loadData()
    } catch (err) {
      toast.error('Erro ao repetir pagamentos do mês')
    }
  }

  const boardColumns = useMemo(() => {
    const base = startOfMonth(new Date())
    return Array.from({ length: 6 }).map((_, i) => addMonths(base, i - 1))
  }, [])

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 overflow-hidden h-full max-w-[1600px] mx-auto w-full">
      <div className="flex items-center gap-3 mb-8 shrink-0">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Wallet className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Pagamentos Administrativos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controle de obrigações, mensalidades e despesas do sistema.
          </p>
        </div>
      </div>

      <Tabs defaultValue="board" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mb-6 self-start bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <TabsTrigger
            value="board"
            className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800"
          >
            Quadro Atual
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800"
          >
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="board"
          className="flex-1 min-h-0 mt-0 data-[state=active]:flex overflow-x-auto pb-4 focus-visible:outline-none"
        >
          <div className="flex gap-4 h-full items-start">
            {boardColumns.map((colDate) => {
              const colItems = payments.filter((p) =>
                isSameMonth(new Date(p.reference_month.replace(' ', 'T')), colDate),
              )
              return (
                <MonthColumn
                  key={colDate.toISOString()}
                  monthDate={colDate}
                  items={colItems}
                  onClone={handleClone}
                />
              )
            })}
          </div>
        </TabsContent>

        <TabsContent
          value="history"
          className="flex-1 min-h-0 mt-0 overflow-y-auto focus-visible:outline-none"
        >
          <HistoryView items={payments} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
