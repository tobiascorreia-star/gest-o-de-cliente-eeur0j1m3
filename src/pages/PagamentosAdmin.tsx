import { useState, useEffect, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

    active.sort((a, b) => (b.ano === a.ano ? b.mes - a.mes : b.ano - a.ano))

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
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-3">
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
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Pagamento
        </Button>
      </div>

      <Tabs defaultValue="active" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mb-6 self-start bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="flex-1 min-h-0 mt-0 overflow-y-auto pr-2 pb-16">
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
