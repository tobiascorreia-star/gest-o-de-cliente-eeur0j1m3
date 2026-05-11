import { useState, useEffect, useMemo, createContext, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Input } from '@/components/ui/input'
import { AdminPayment } from '@/types'
import { getAdminPayments, createAdminPayment, updateAdminPayment } from '@/services/admin_payments'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'
import { Wallet, Plus, Search, X, CalendarClock, AlertTriangle } from 'lucide-react'
import { ActiveMonthsView } from '@/components/admin-payments/active-months-view'
import { Badge } from '@/components/ui/badge'
import {
  cn,
  isOverdueBusiness,
  isTodayBusiness,
  isTomorrowBusiness,
  getEffectiveDueDate,
} from '@/lib/utils'
import { startOfDay } from 'date-fns'
import { Card } from '@/components/ui/card'
import { HistoryYearsView } from '@/components/admin-payments/history-years-view'
import { Button } from '@/components/ui/button'
import { PaymentModal } from '@/components/admin-payments/payment-modal'
import { useAuth } from '@/hooks/use-auth'

export const AdminPaymentsFilterContext = createContext<{
  status: 'all' | 'pending' | 'paid'
  search: string
  dueDateFilter: 'all' | 'today' | 'tomorrow'
}>({ status: 'all', search: '', dueDateFilter: 'all' })

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
  const [searchTerm, setSearchTerm] = useState('')
  const [dueDateFilter, setDueDateFilter] = useState<'all' | 'today' | 'tomorrow'>('all')
  const searchInputRef = useRef<HTMLInputElement>(null)

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

    const handleOptimistic = (e: any) => {
      const { id, updates } = e.detail
      setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
    }
    window.addEventListener('admin-payment-optimistic', handleOptimistic)
    return () => window.removeEventListener('admin-payment-optimistic', handleOptimistic)
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

    const searchNormalized = searchTerm
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    const isSearchActive = searchTerm !== ''
    const hasFilter = isSearchActive || statusFilter !== 'all' || dueDateFilter !== 'all'

    Object.entries(groupedByMonthYear).forEach(([key, items]) => {
      const [anoStr, mesStr] = key.split('-')
      const ano = parseInt(anoStr, 10)
      const mes = parseInt(mesStr, 10)

      const isAllPaid = items.length > 0 && items.every((i) => i.status)
      const isCurrent = key === currentKey

      const filteredItems = items.filter((p) => {
        const matchesSearch = isSearchActive
          ? p.dono_pagamento
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .includes(searchNormalized)
          : true
        const matchesStatus =
          statusFilter === 'all' || (statusFilter === 'paid' ? p.status : !p.status)

        let matchesDueDate = true
        if (dueDateFilter === 'today') {
          matchesDueDate = false
          if (!p.status && p.data_notificacao) {
            const notifDateStr = p.data_notificacao.replace(' ', 'T')
            if (isTodayBusiness(notifDateStr) || isOverdueBusiness(notifDateStr)) {
              matchesDueDate = true
            }
          }
        } else if (dueDateFilter === 'tomorrow') {
          matchesDueDate = false
          if (!p.status && p.data_notificacao) {
            const notifDateStr = p.data_notificacao.replace(' ', 'T')
            if (isTomorrowBusiness(notifDateStr)) {
              matchesDueDate = true
            }
          }
        }

        return matchesSearch && matchesStatus && matchesDueDate
      })

      if (filteredItems.length === 0) {
        if (items.length === 0 && !hasFilter && isCurrent) {
          active.push({ mes, ano, items: [] })
        }
        return
      }

      if (isAllPaid && !isCurrent) {
        if (!history[ano]) history[ano] = []
        history[ano].push({ mes, ano, items: filteredItems })
      } else {
        active.push({ mes, ano, items: filteredItems })
      }
    })

    active.sort((a, b) => {
      const aHasOverdue = a.items.some(
        (i) =>
          !i.status &&
          i.data_notificacao &&
          isOverdueBusiness(new Date(i.data_notificacao.split(' ')[0] + 'T00:00:00')),
      )
      const bHasOverdue = b.items.some(
        (i) =>
          !i.status &&
          i.data_notificacao &&
          isOverdueBusiness(new Date(i.data_notificacao.split(' ')[0] + 'T00:00:00')),
      )

      if (aHasOverdue && !bHasOverdue) return -1
      if (!aHasOverdue && bHasOverdue) return 1

      return b.ano === a.ano ? b.mes - a.mes : b.ano - a.ano
    })

    Object.keys(history).forEach((ano) => {
      history[Number(ano)].sort((a, b) => b.mes - a.mes)
    })

    return { activeMonths: active, historyYears: history }
  }, [payments, searchTerm, statusFilter, dueDateFilter])

  const { todayCount, tomorrowCount } = useMemo(() => {
    let today = 0
    let tomorrow = 0

    payments.forEach((p) => {
      if (!p.status && p.data_notificacao) {
        const notifDateStr = p.data_notificacao.replace(' ', 'T')
        if (isTodayBusiness(notifDateStr) || isOverdueBusiness(notifDateStr)) today++
        else if (isTomorrowBusiness(notifDateStr)) tomorrow++
      }
    })

    return { todayCount: today, tomorrowCount: tomorrow }
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

      <AdminPaymentsFilterContext.Provider
        value={{ status: statusFilter, search: searchTerm, dueDateFilter }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 shrink-0">
          <Card
            className={cn(
              'cursor-pointer transition-all border-l-4 overflow-hidden shadow-sm',
              dueDateFilter === 'today'
                ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20 ring-1 ring-red-500/20'
                : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-900/50 border-slate-200 dark:border-slate-800',
            )}
            onClick={() => setDueDateFilter((f) => (f === 'today' ? 'all' : 'today'))}
          >
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Vencendo Hoje / Atrasado
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-red-600 dark:text-red-500">
                    {todayCount}
                  </span>
                  <span className="text-sm text-slate-400 mb-1 font-medium">pagamentos</span>
                </div>
              </div>
              <div
                className={cn(
                  'p-3 rounded-full',
                  dueDateFilter === 'today'
                    ? 'bg-red-100 dark:bg-red-900/40'
                    : 'bg-red-50 dark:bg-red-900/20',
                )}
              >
                <CalendarClock className="w-6 h-6 text-red-600 dark:text-red-500" />
              </div>
            </div>
          </Card>

          <Card
            className={cn(
              'cursor-pointer transition-all border-l-4 overflow-hidden shadow-sm',
              dueDateFilter === 'tomorrow'
                ? 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20 ring-1 ring-amber-500/20'
                : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-900/50 border-slate-200 dark:border-slate-800',
            )}
            onClick={() => setDueDateFilter((f) => (f === 'tomorrow' ? 'all' : 'tomorrow'))}
          >
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Vencendo em 1 dia
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-amber-600 dark:text-amber-500">
                    {tomorrowCount}
                  </span>
                  <span className="text-sm text-slate-400 mb-1 font-medium">pagamentos</span>
                </div>
              </div>
              <div
                className={cn(
                  'p-3 rounded-full',
                  dueDateFilter === 'tomorrow'
                    ? 'bg-amber-100 dark:bg-amber-900/40'
                    : 'bg-amber-50 dark:bg-amber-900/20',
                )}
              >
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              </div>
            </div>
          </Card>

          {dueDateFilter !== 'all' && (
            <div className="flex items-center sm:col-span-2 lg:col-span-1">
              <Button
                variant="ghost"
                onClick={() => setDueDateFilter('all')}
                className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>

        <Tabs defaultValue="active" className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 shrink-0 gap-4">
            <TabsList className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0">
              <TabsTrigger value="active">Ativos</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  ref={searchInputRef}
                  placeholder="Buscar dono do pagamento..."
                  className="pl-9 pr-8 h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('')
                      searchInputRef.current?.focus()
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                    aria-label="Limpar busca"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <ToggleGroup
                  type="single"
                  value={statusFilter}
                  onValueChange={(v) => v && setStatusFilter(v as any)}
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 self-start sm:self-auto"
                >
                  <ToggleGroupItem value="all" className="h-9 text-sm px-3">
                    Todos
                  </ToggleGroupItem>
                  <ToggleGroupItem value="pending" className="h-9 text-sm px-3">
                    A pagar
                  </ToggleGroupItem>
                  <ToggleGroupItem value="paid" className="h-9 text-sm px-3">
                    Pagos
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
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
