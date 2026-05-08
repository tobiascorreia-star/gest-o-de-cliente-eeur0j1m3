import { useState, useEffect, useMemo, createContext } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { AdminPayment } from '@/types'
import { getAdminPayments, createAdminPayment, updateAdminPayment } from '@/services/admin_payments'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'
import { Wallet, Plus } from 'lucide-react'
import { ActiveMonthsView } from '@/components/admin-payments/active-months-view'
import { HistoryYearsView } from '@/components/admin-payments/history-years-view'
import { Button } from '@/components/ui/button'
import { PaymentModal } from '@/components/admin-payments/payment-modal'
import { useAuth } from '@/hooks/use-auth'

export const AdminPaymentsFilterContext = createContext<'all' | 'pending' | 'paid'>('all')

export default function PagamentosAdmin() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AdminPayment | null>(null)
  const [addingParams, setAddingParams] = useState<{
    mes: number
    ano: number
    owner: string
  } | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all')

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

  const { activeMonths, historyYears } = useMemo(() => {
    const groupedByMonthYear: Record<string, AdminPayment[]> = {}

    payments.forEach((p) => {
      const key = `${p.ano_referencia}-${p.mes_referencia}`
      if (!groupedByMonthYear[key]) groupedByMonthYear[key] = []
      groupedByMonthYear[key].push(p)
    })

    const now = new Date()
    const currentKey = `${now.getFullYear()}-${now.getMonth() + 1}`
    if (!groupedByMonthYear[currentKey]) {
      groupedByMonthYear[currentKey] = []
    }

    const active: { mes: number; ano: number; items: AdminPayment[] }[] = []
    const history: Record<number, { mes: number; ano: number; items: AdminPayment[] }[]> = {}

    Object.entries(groupedByMonthYear).forEach(([key, items]) => {
      const [anoStr, mesStr] = key.split('-')
      const ano = parseInt(anoStr, 10)
      const mes = parseInt(mesStr, 10)

      const isAllPaid = items.length > 0 && items.every((i) => i.status)
      const isCurrent = key === currentKey

      if (isAllPaid && !isCurrent) {
        if (!history[ano]) history[ano] = []
        history[ano].push({ mes, ano, items })
      } else {
        active.push({ mes, ano, items })
      }
    })

    active.sort((a, b) => {
      const today = new Date().toISOString()
      const aHasOverdue = a.items.some(
        (i) => !i.status && !!i.data_notificacao && i.data_notificacao <= today,
      )
      const bHasOverdue = b.items.some(
        (i) => !i.status && !!i.data_notificacao && i.data_notificacao <= today,
      )

      if (aHasOverdue && !bHasOverdue) return -1
      if (!aHasOverdue && bHasOverdue) return 1

      return b.ano === a.ano ? b.mes - a.mes : b.ano - a.ano
    })

    Object.keys(history).forEach((ano) => {
      history[Number(ano)].sort((a, b) => b.mes - a.mes)
    })

    return { activeMonths: active, historyYears: history }
  }, [payments])

  const handleSave = async (data: Partial<AdminPayment>) => {
    if (!user) return
    try {
      await createAdminPayment({ ...data, admin: user.id })
      toast.success('Pagamento adicionado com sucesso!')
      setIsModalOpen(false)
    } catch (err) {
      toast.error('Erro ao salvar pagamento')
    }
  }

  const handleSaveEdit = async (data: Partial<AdminPayment>) => {
    if (!editingItem) return
    try {
      await updateAdminPayment(editingItem.id, data)
      toast.success('Atualizado com sucesso!')
      setEditingItem(null)
    } catch {
      toast.error('Erro ao atualizar.')
    }
  }

  const handleSaveAdd = async (data: Partial<AdminPayment>) => {
    if (!user) return
    try {
      await createAdminPayment({ ...data, admin: user.id })
      toast.success('Adicionado com sucesso!')
      setAddingParams(null)
    } catch {
      toast.error('Erro ao adicionar.')
    }
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 overflow-hidden h-full max-w-[1200px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl shrink-0">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Pagamentos Administrativos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Controle de obrigações, mensalidades e despesas do sistema.
            </p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Novo Pagamento
        </Button>
      </div>

      <AdminPaymentsFilterContext.Provider value={statusFilter}>
        <Tabs defaultValue="active" className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 shrink-0 gap-4">
            <TabsList className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0">
              <TabsTrigger value="active">Ativos</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <ToggleGroup
              type="single"
              value={statusFilter}
              onValueChange={(v) => v && setStatusFilter(v as any)}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 self-start sm:self-auto"
            >
              <ToggleGroupItem value="all" className="h-8 text-xs px-3">
                Todos
              </ToggleGroupItem>
              <ToggleGroupItem value="pending" className="h-8 text-xs px-3">
                A pagar
              </ToggleGroupItem>
              <ToggleGroupItem value="paid" className="h-8 text-xs px-3">
                Pagos
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <TabsContent
            value="active"
            className="flex-1 min-h-0 mt-0 overflow-hidden data-[state=active]:flex flex-col"
          >
            <ActiveMonthsView
              months={activeMonths}
              onEditItem={setEditingItem}
              onAddForOwner={(mes, ano, owner) => setAddingParams({ mes, ano, owner })}
            />
          </TabsContent>

          <TabsContent value="history" className="flex-1 min-h-0 mt-0 overflow-y-auto pr-2 pb-16">
            <HistoryYearsView
              years={historyYears}
              onEditItem={setEditingItem}
              onAddForOwner={(mes, ano, owner) => setAddingParams({ mes, ano, owner })}
            />
          </TabsContent>
        </Tabs>
      </AdminPaymentsFilterContext.Provider>

      <PaymentModal open={isModalOpen} onOpenChange={setIsModalOpen} onSave={handleSave} />

      <PaymentModal
        open={!!editingItem}
        onOpenChange={(v) => !v && setEditingItem(null)}
        initialData={editingItem}
        onSave={handleSaveEdit}
      />

      <PaymentModal
        open={!!addingParams}
        onOpenChange={(v) => !v && setAddingParams(null)}
        defaultMonth={addingParams?.mes}
        defaultYear={addingParams?.ano}
        defaultOwner={addingParams?.owner}
        onSave={handleSaveAdd}
      />
    </div>
  )
}
