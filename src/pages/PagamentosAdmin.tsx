import { useState, useEffect, useMemo, createContext, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Input } from '@/components/ui/input'
import { AdminPayment } from '@/types'
import {
  getAdminPayments,
  createAdminPayment,
  updateAdminPayment,
  bulkArchiveAdminPayments,
  bulkUnarchiveAdminPayments,
  bulkDeleteAdminPayments,
} from '@/services/admin_payments'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'
import {
  Wallet,
  Plus,
  Search,
  X,
  CalendarClock,
  AlertTriangle,
  Archive,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import { ActiveMonthsView } from '@/components/admin-payments/active-months-view'
import { Badge } from '@/components/ui/badge'
import { cn, isOverdueBusiness, isTodayBusiness, isTomorrowBusiness } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { HistoryYearsView } from '@/components/admin-payments/history-years-view'
import { Button } from '@/components/ui/button'
import { PaymentModal } from '@/components/admin-payments/payment-modal'
import { useAuth } from '@/hooks/use-auth'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export const AdminPaymentsFilterContext = createContext<{
  status: 'all' | 'pending' | 'paid'
  search: string
  dueDateFilter: 'all' | 'today' | 'tomorrow'
  monthYearFilter: string
}>({ status: 'all', search: '', dueDateFilter: 'all', monthYearFilter: 'all' })

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
  const [monthYearFilter, setMonthYearFilter] = useState('all')

  const [bulkAction, setBulkAction] = useState<'archive' | 'unarchive' | 'delete' | null>(null)
  const [bulkMonthYear, setBulkMonthYear] = useState<string>('')
  const [isProcessingBulk, setIsProcessingBulk] = useState(false)

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

  const availableMonths = useMemo(() => {
    const map = new Map<string, string>()
    payments.forEach((p) => {
      const y = p.ano_referencia
      const m = p.mes_referencia
      const key = `${y}-${m.toString().padStart(2, '0')}`
      const label = `${MONTH_NAMES[m - 1]} ${y}`
      map.set(key, label)
    })
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => b.value.localeCompare(a.value))
  }, [payments])

  const { activeMonths, historyYears } = useMemo(() => {
    const activePayments = payments.filter((p) => !p.archived)
    const historyPayments = payments.filter((p) => p.archived)

    const groupItems = (items: AdminPayment[]) => {
      const map: Record<string, AdminPayment[]> = {}
      items.forEach((p) => {
        const key = `${p.ano_referencia}-${p.mes_referencia}`
        if (!map[key]) map[key] = []
        map[key].push(p)
      })
      return map
    }

    const groupedActive = groupItems(activePayments)
    const groupedHistory = groupItems(historyPayments)

    const now = new Date()
    const currentKey = `${now.getFullYear()}-${now.getMonth() + 1}`
    if (monthYearFilter === 'all' && !groupedActive[currentKey]) {
      groupedActive[currentKey] = []
    }

    const active: { mes: number; ano: number; items: AdminPayment[] }[] = []
    const history: Record<number, { mes: number; ano: number; items: AdminPayment[] }[]> = {}

    const searchNormalized = searchTerm
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    const isSearchActive = searchTerm !== ''
    const hasFilter =
      isSearchActive ||
      statusFilter !== 'all' ||
      dueDateFilter !== 'all' ||
      monthYearFilter !== 'all'

    const filterItem = (p: AdminPayment) => {
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
          try {
            const notifDateStr = p.data_notificacao.replace(' ', 'T')
            const d = new Date(notifDateStr)
            if (
              !isNaN(d.getTime()) &&
              (isTodayBusiness(notifDateStr) || isOverdueBusiness(notifDateStr))
            ) {
              matchesDueDate = true
            }
          } catch {
            // Ignore invalid date
          }
        }
      } else if (dueDateFilter === 'tomorrow') {
        matchesDueDate = false
        if (!p.status && p.data_notificacao) {
          try {
            const notifDateStr = p.data_notificacao.replace(' ', 'T')
            const d = new Date(notifDateStr)
            if (!isNaN(d.getTime()) && isTomorrowBusiness(notifDateStr)) {
              matchesDueDate = true
            }
          } catch {
            // Ignore invalid date
          }
        }
      }

      return matchesSearch && matchesStatus && matchesDueDate
    }

    Object.entries(groupedActive).forEach(([key, items]) => {
      const [anoStr, mesStr] = key.split('-')
      const ano = parseInt(anoStr, 10)
      const mes = parseInt(mesStr, 10)
      const isCurrent = key === currentKey

      if (monthYearFilter !== 'all') {
        const mKey = `${ano}-${mes.toString().padStart(2, '0')}`
        if (mKey !== monthYearFilter) return
      }

      const filteredItems = items.filter(filterItem)

      if (filteredItems.length === 0) {
        if (items.length === 0 && !hasFilter && isCurrent) {
          active.push({ mes, ano, items: [] })
        }
        return
      }
      active.push({ mes, ano, items: filteredItems })
    })

    Object.entries(groupedHistory).forEach(([key, items]) => {
      const [anoStr, mesStr] = key.split('-')
      const ano = parseInt(anoStr, 10)
      const mes = parseInt(mesStr, 10)

      if (monthYearFilter !== 'all') {
        const mKey = `${ano}-${mes.toString().padStart(2, '0')}`
        if (mKey !== monthYearFilter) return
      }

      const filteredItems = items.filter(filterItem)
      if (filteredItems.length === 0) return

      if (!history[ano]) history[ano] = []
      history[ano].push({ mes, ano, items: filteredItems })
    })

    active.sort((a, b) => {
      const aHasOverdue = a.items.some((i) => {
        if (i.status || !i.data_notificacao) return false
        try {
          const d = new Date(i.data_notificacao.split(' ')[0] + 'T00:00:00')
          return !isNaN(d.getTime()) && isOverdueBusiness(d)
        } catch {
          return false
        }
      })
      const bHasOverdue = b.items.some((i) => {
        if (i.status || !i.data_notificacao) return false
        try {
          const d = new Date(i.data_notificacao.split(' ')[0] + 'T00:00:00')
          return !isNaN(d.getTime()) && isOverdueBusiness(d)
        } catch {
          return false
        }
      })

      if (aHasOverdue && !bHasOverdue) return -1
      if (!aHasOverdue && bHasOverdue) return 1

      return b.ano === a.ano ? b.mes - a.mes : b.ano - a.ano
    })

    Object.keys(history).forEach((ano) => {
      history[Number(ano)].sort((a, b) => b.mes - a.mes)
    })

    return { activeMonths: active, historyYears: history }
  }, [payments, searchTerm, statusFilter, dueDateFilter, monthYearFilter])

  const { todayCount, tomorrowCount } = useMemo(() => {
    let today = 0
    let tomorrow = 0

    payments.forEach((p) => {
      if (!p.archived && !p.status && p.data_notificacao) {
        try {
          const notifDateStr = p.data_notificacao.replace(' ', 'T')
          const d = new Date(notifDateStr)
          if (!isNaN(d.getTime())) {
            if (isTodayBusiness(notifDateStr) || isOverdueBusiness(notifDateStr)) today++
            else if (isTomorrowBusiness(notifDateStr)) tomorrow++
          }
        } catch {
          // Ignore invalid dates
        }
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

  const handleExecuteBulkAction = async () => {
    if (!bulkMonthYear) return
    const [y, m] = bulkMonthYear.split('-').map(Number)
    setIsProcessingBulk(true)
    try {
      if (bulkAction === 'archive') {
        await bulkArchiveAdminPayments(m, y)
        toast.success('Mês arquivado com sucesso!')
      } else if (bulkAction === 'unarchive') {
        await bulkUnarchiveAdminPayments(m, y)
        toast.success('Mês restaurado com sucesso!')
      } else if (bulkAction === 'delete') {
        await bulkDeleteAdminPayments(m, y)
        toast.success('Pagamentos excluídos com sucesso!')
      }
      setBulkAction(null)
      loadData()
    } catch (err) {
      toast.error('Erro ao processar ação em massa')
    } finally {
      setIsProcessingBulk(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 overflow-hidden h-full max-w-[1200px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 w-full max-w-full">
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

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => {
              setBulkMonthYear(monthYearFilter !== 'all' ? monthYearFilter : '')
              setBulkAction('unarchive')
            }}
            className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 flex-1 min-w-[120px] sm:min-w-[140px] sm:flex-none justify-center px-2"
          >
            <RotateCcw className="w-4 h-4 sm:mr-2 mr-1 shrink-0 text-slate-500" />
            <span className="hidden sm:inline">Voltar para Ativo</span>
            <span className="sm:hidden truncate">Restaurar</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setBulkMonthYear(monthYearFilter !== 'all' ? monthYearFilter : '')
              setBulkAction('archive')
            }}
            className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 flex-1 min-w-[120px] sm:min-w-[140px] sm:flex-none justify-center px-2"
          >
            <Archive className="w-4 h-4 sm:mr-2 mr-1 shrink-0 text-slate-500" />
            <span className="hidden sm:inline">Arquivar no Histórico</span>
            <span className="sm:hidden truncate">Arquivar</span>
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setBulkMonthYear(monthYearFilter !== 'all' ? monthYearFilter : '')
              setBulkAction('delete')
            }}
            className="flex-1 min-w-[120px] sm:min-w-[140px] sm:flex-none justify-center px-2"
          >
            <Trash2 className="w-4 h-4 sm:mr-2 mr-1 shrink-0" />
            <span className="hidden sm:inline">Excluir Tudo</span>
            <span className="sm:hidden truncate">Excluir</span>
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="gap-1 sm:gap-2 flex-1 min-w-[120px] sm:min-w-[140px] sm:flex-none justify-center px-2"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Novo Pagamento</span>
            <span className="sm:hidden truncate">Novo</span>
          </Button>
        </div>
      </div>

      <AdminPaymentsFilterContext.Provider
        value={{ status: statusFilter, search: searchTerm, dueDateFilter, monthYearFilter }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 w-full max-w-full">
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
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1 truncate whitespace-normal leading-tight">
                  Vencendo Hoje / Atrasado
                </p>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-bold text-red-600 dark:text-red-500 leading-none">
                    {todayCount}
                  </span>
                  <span className="text-sm text-slate-400 font-medium leading-none">
                    pagamentos
                  </span>
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
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1 truncate whitespace-normal leading-tight">
                  Vencendo em 1 dia
                </p>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-bold text-amber-600 dark:text-amber-500 leading-none">
                    {tomorrowCount}
                  </span>
                  <span className="text-sm text-slate-400 font-medium leading-none">
                    pagamentos
                  </span>
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
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 shrink-0 gap-4">
            <TabsList className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0 w-full sm:w-auto flex">
              <TabsTrigger value="active" className="flex-1 sm:flex-none">
                Ativos
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 sm:flex-none">
                Histórico
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                <Select value={monthYearFilter} onValueChange={setMonthYearFilter}>
                  <SelectTrigger className="w-[130px] shrink-0 sm:w-[150px] bg-white dark:bg-slate-950 h-9">
                    <SelectValue placeholder="Mês/Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Meses</SelectItem>
                    {availableMonths.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative flex-1 min-w-[100px] sm:min-w-[150px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Buscar dono..."
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
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <ToggleGroup
                  type="single"
                  value={statusFilter}
                  onValueChange={(v) => v && setStatusFilter(v as any)}
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 w-full sm:w-auto justify-start"
                >
                  <ToggleGroupItem value="all" className="h-9 text-sm px-3 flex-1 sm:flex-none">
                    Todos
                  </ToggleGroupItem>
                  <ToggleGroupItem value="pending" className="h-9 text-sm px-3 flex-1 sm:flex-none">
                    A pagar
                  </ToggleGroupItem>
                  <ToggleGroupItem value="paid" className="h-9 text-sm px-3 flex-1 sm:flex-none">
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

          <TabsContent
            value="history"
            className="flex-1 min-h-0 mt-0 overflow-y-auto pr-2 pb-16 scrollbar-thin"
          >
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

      <Dialog open={!!bulkAction} onOpenChange={(o) => !o && setBulkAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'archive' && 'Arquivar no Histórico'}
              {bulkAction === 'unarchive' && 'Voltar para Ativo'}
              {bulkAction === 'delete' && 'Excluir Todos os Registros'}
            </DialogTitle>
            <DialogDescription>
              {bulkAction === 'archive' &&
                'Esta ação moverá todos os pagamentos do período selecionado para o histórico. Eles deixarão de aparecer na visão ativa.'}
              {bulkAction === 'unarchive' &&
                'Esta ação moverá todos os pagamentos do período selecionado do histórico de volta para a visão ativa.'}
              {bulkAction === 'delete' &&
                'Atenção: Esta ação excluirá permanentemente todos os pagamentos do período selecionado. Esta ação não pode ser desfeita.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Selecione o Mês e Ano</Label>
            <Select value={bulkMonthYear} onValueChange={setBulkMonthYear}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um período" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkAction(null)}
              disabled={isProcessingBulk}
            >
              Cancelar
            </Button>
            <Button
              variant={bulkAction === 'delete' ? 'destructive' : 'default'}
              disabled={!bulkMonthYear || isProcessingBulk}
              onClick={handleExecuteBulkAction}
            >
              {isProcessingBulk ? 'Aguarde...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
