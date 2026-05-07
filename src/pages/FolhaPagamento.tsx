import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import {
  Plus,
  Download,
  Printer,
  Edit,
  Trash2,
  Banknote,
  Loader2,
  Save,
  Info,
  RotateCcw,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { logAudit } from '@/services/audit'

const InfoTooltip = ({ text }: { text: string }) => (
  <Tooltip>
    <TooltipTrigger type="button" tabIndex={-1} className="cursor-help align-middle ml-1">
      <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" />
    </TooltipTrigger>
    <TooltipContent>
      <p className="max-w-xs text-sm">{text}</p>
    </TooltipContent>
  </Tooltip>
)

const formatCurrencyInput = (val: number | null | undefined): string => {
  if (val === null || val === undefined) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

const parseCurrencyInput = (val: string): number | null => {
  if (!val) return null
  const v = val.replace(/\D/g, '')
  if (v === '') return null
  return parseInt(v, 10) / 100
}

export default function FolhaPagamento() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialUserId = searchParams.get('user')

  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterUser, setFilterUser] = useState(initialUserId || 'all')

  const [draftPayrolls, setDraftPayrolls] = useState<any[]>([])
  const [globalQty, setGlobalQty] = useState<string>('')
  const [settingsId, setSettingsId] = useState<string>('')

  const [isOpen, setIsOpen] = useState(false)
  const [isConsolidating, setIsConsolidating] = useState(false)
  const [savingRowId, setSavingRowId] = useState<string | null>(null)
  const [isClosingMonth, setIsClosingMonth] = useState(false)
  const [isRevertingMonth, setIsRevertingMonth] = useState(false)

  const [editingRecord, setEditingRecord] = useState<any>(null)

  const [employee, setEmployee] = useState('')
  const [baseSalary, setBaseSalary] = useState<number | null>(null)
  const [unitValue, setUnitValue] = useState<number | null>(null)
  const [installComm, setInstallComm] = useState<number | null>(null)
  const [bonus, setBonus] = useState<number | null>(null)
  const [extra1, setExtra1] = useState<number | null>(null)
  const [extra2, setExtra2] = useState<number | null>(null)
  const [extra3, setExtra3] = useState<number | null>(null)
  const [extra4, setExtra4] = useState<number | null>(null)
  const [status, setStatus] = useState('Pendente')
  const [observations, setObservations] = useState('')
  const [isClosed, setIsClosed] = useState(false)

  const [receiptRecord, setReceiptRecord] = useState<any>(null)

  const loadMonthData = async () => {
    setLoading(true)
    setDraftPayrolls([])
    try {
      const uData = await pb.collection('users').getFullList({
        filter: 'active = true',
        sort: 'name',
      })
      setUsers(uData)

      if (!filterMonth) {
        setDraftPayrolls([])
        setLoading(false)
        return
      }

      const [yStr, mStr] = filterMonth.split('-')
      const y = parseInt(yStr, 10)
      const m = parseInt(mStr, 10) - 1

      const startOfMo = new Date(Date.UTC(y, m, 1, 0, 0, 0)).toISOString()
      const endOfMo = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0)).toISOString()

      const pData = await pb.collection('payroll').getFullList({
        filter: `reference_date >= '${startOfMo}' && reference_date < '${endOfMo}'`,
        expand: 'employee',
        sort: '-created',
      })

      let qty = ''
      let sId = ''
      try {
        const sData = await pb
          .collection('payroll_settings')
          .getFirstListItem(`reference_date >= '${startOfMo}' && reference_date < '${endOfMo}'`)
        qty = sData.quantity?.toString() || ''
        sId = sData.id
      } catch {
        /* intentionally ignored */
      }

      const combined = pData.map((p) => ({ ...p, _isDraft: false, _isModified: false }))

      setDraftPayrolls(combined)
      setGlobalQty(qty)
      setSettingsId(sId)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro', description: 'Falha ao carregar dados.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMonthData()
    return () => {
      setDraftPayrolls([])
    }
  }, [filterMonth])

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hasUnsaved = draftPayrolls.some((p) => p._isDraft || p._isModified)
    if (hasUnsaved) {
      if (
        !confirm(
          'Existem alterações não salvas. Deseja realmente mudar de mês e perder essas alterações?',
        )
      ) {
        return
      }
    }
    setFilterMonth(e.target.value)
  }

  const handleGlobalQtyChange = (val: string) => {
    setGlobalQty(val)
    const q = parseFloat(val) || 0
    setDraftPayrolls((prev) =>
      prev.map((p) => {
        if (p.closed) return p
        const unit = p.unit_value || 0
        const calculatedInstallComm = unit * q
        const total =
          (p.base_salary || 0) +
          calculatedInstallComm +
          (p.bonus || 0) +
          (p.extra_1 || 0) +
          (p.extra_2 || 0) +
          (p.extra_3 || 0) +
          (p.extra_4 || 0)
        return {
          ...p,
          install_commission: calculatedInstallComm,
          total,
          _isModified: true,
        }
      }),
    )
  }

  const openForm = (p?: any) => {
    if (p) {
      setEditingRecord(p)
      setEmployee(p.employee)
      setBaseSalary(p.base_salary ?? null)
      setUnitValue(p.unit_value ?? null)
      if (!p.closed) {
        setInstallComm((p.unit_value || 0) * (parseFloat(globalQty) || 0))
      } else {
        setInstallComm(p.install_commission ?? null)
      }
      setBonus(p.bonus ?? null)
      setExtra1(p.extra_1 ?? null)
      setExtra2(p.extra_2 ?? null)
      setExtra3(p.extra_3 ?? null)
      setExtra4(p.extra_4 ?? null)
      setStatus(p.status || 'Pendente')
      setObservations(p.observations || '')
      setIsClosed(p.closed || false)
    } else {
      setEditingRecord(null)
      setEmployee(filterUser !== 'all' ? filterUser : '')
      setBaseSalary(null)
      setUnitValue(null)
      setInstallComm(0)
      setBonus(null)
      setExtra1(null)
      setExtra2(null)
      setExtra3(null)
      setExtra4(null)
      setStatus('Pendente')
      setObservations('')
      setIsClosed(false)
    }
    setIsOpen(true)
  }

  const handleUnitValueChange = (val: string) => {
    const uv = parseCurrencyInput(val)
    setUnitValue(uv)
    if (!editingRecord?.closed) {
      const q = parseFloat(globalQty) || 0
      setInstallComm((uv || 0) * q)
    }
  }

  const handleSaveToMemory = () => {
    if (!employee) {
      toast({ title: 'Erro', description: 'Selecione o colaborador.', variant: 'destructive' })
      return
    }

    const q = parseFloat(globalQty) || 0
    const calculatedInstallComm = (unitValue || 0) * q
    const total =
      (baseSalary || 0) +
      calculatedInstallComm +
      (bonus || 0) +
      (extra1 || 0) +
      (extra2 || 0) +
      (extra3 || 0) +
      (extra4 || 0)

    const [y, m] = filterMonth.split('-')
    const startOfMo = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, 1, 0, 0, 0)).toISOString()

    const data = {
      employee,
      reference_date: startOfMo,
      base_salary: baseSalary || 0,
      unit_value: unitValue || 0,
      install_commission: calculatedInstallComm,
      bonus: bonus || 0,
      extra_1: extra1 || 0,
      extra_2: extra2 || 0,
      extra_3: extra3 || 0,
      extra_4: extra4 || 0,
      total,
      status,
      observations,
      closed: isClosed,
    }

    if (editingRecord) {
      setDraftPayrolls((prev) =>
        prev.map((item) => {
          if (item === editingRecord) {
            return {
              ...item,
              ...data,
              expand: { ...item.expand, employee: users.find((u) => u.id === employee) },
              _isModified: true,
            }
          }
          return item
        }),
      )
    } else {
      const exists = draftPayrolls.some((p) => p.employee === employee)
      if (exists) {
        toast({
          title: 'Erro',
          description: 'Colaborador já possui lançamento neste mês.',
          variant: 'destructive',
        })
        return
      }

      setDraftPayrolls([
        ...draftPayrolls,
        {
          ...data,
          expand: { employee: users.find((u) => u.id === employee) },
          _isDraft: true,
          _isModified: true,
        },
      ])
    }
    setIsOpen(false)
  }

  const handleSaveRow = async (p: any) => {
    setSavingRowId(p.employee)
    try {
      let currentSettingsId = settingsId
      const [y, m] = filterMonth.split('-')
      const startOfMo = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, 1, 0, 0, 0)).toISOString()

      if (!currentSettingsId && globalQty !== '') {
        const s = await pb.collection('payroll_settings').create({
          reference_date: startOfMo,
          quantity: parseFloat(globalQty) || 0,
        })
        setSettingsId(s.id)
        currentSettingsId = s.id
      } else if (currentSettingsId) {
        await pb.collection('payroll_settings').update(currentSettingsId, {
          quantity: parseFloat(globalQty) || 0,
        })
      }

      const data = {
        employee: p.employee,
        reference_date: p.reference_date,
        base_salary: p.base_salary,
        unit_value: p.unit_value,
        install_commission: p.install_commission,
        bonus: p.bonus,
        extra_1: p.extra_1,
        extra_2: p.extra_2,
        extra_3: p.extra_3,
        extra_4: p.extra_4,
        total: p.total,
        status: p.status,
        observations: p.observations,
        closed: p.closed,
      }

      let saved
      if (p.id) {
        saved = await pb.collection('payroll').update(p.id, data, { expand: 'employee' })
      } else {
        saved = await pb.collection('payroll').create(data, { expand: 'employee' })
      }

      setDraftPayrolls((prev) =>
        prev.map((item) =>
          item === p ? { ...item, ...saved, _isDraft: false, _isModified: false } : item,
        ),
      )
      toast({ title: 'Sucesso', description: 'Registro gravado.' })
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao gravar.', variant: 'destructive' })
    } finally {
      setSavingRowId(null)
    }
  }

  const handleConsolidate = async () => {
    setIsConsolidating(true)
    try {
      let currentSettingsId = settingsId
      const [y, m] = filterMonth.split('-')
      const startOfMo = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, 1, 0, 0, 0)).toISOString()

      if (!currentSettingsId && globalQty !== '') {
        const s = await pb.collection('payroll_settings').create({
          reference_date: startOfMo,
          quantity: parseFloat(globalQty) || 0,
        })
        setSettingsId(s.id)
      } else if (currentSettingsId) {
        await pb.collection('payroll_settings').update(currentSettingsId, {
          quantity: parseFloat(globalQty) || 0,
        })
      }

      const updatedDrafts = [...draftPayrolls]
      for (let i = 0; i < updatedDrafts.length; i++) {
        const p = updatedDrafts[i]
        if (!p._isDraft && !p._isModified) continue

        const data = {
          employee: p.employee,
          reference_date: p.reference_date,
          base_salary: p.base_salary,
          unit_value: p.unit_value,
          install_commission: p.install_commission,
          bonus: p.bonus,
          extra_1: p.extra_1,
          extra_2: p.extra_2,
          extra_3: p.extra_3,
          extra_4: p.extra_4,
          total: p.total,
          status: p.status,
          observations: p.observations,
          closed: p.closed,
        }

        let saved
        if (p.id) {
          saved = await pb.collection('payroll').update(p.id, data, { expand: 'employee' })
        } else {
          saved = await pb.collection('payroll').create(data, { expand: 'employee' })
        }
        updatedDrafts[i] = { ...p, ...saved, _isDraft: false, _isModified: false }
      }
      setDraftPayrolls(updatedDrafts)
      toast({ title: 'Sucesso', description: 'Todos os registros foram consolidados.' })
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao consolidar o mês.', variant: 'destructive' })
    } finally {
      setIsConsolidating(false)
    }
  }

  const handleDelete = async (p: any) => {
    if (!confirm('Tem certeza que deseja excluir?')) return
    if (p.id) {
      try {
        await pb.collection('payroll').delete(p.id)
        toast({ title: 'Sucesso', description: 'Registro excluído.' })
      } catch (err) {
        toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
        return
      }
    }
    setDraftPayrolls((prev) =>
      prev.filter((item) => (p.id ? item.id !== p.id : item.employee !== p.employee)),
    )
  }

  const handleExportCSV = () => {
    const headers = [
      'Colaborador',
      'Competência',
      'Salário Base',
      'Valor do Install',
      'Incentivo',
      'Bônus',
      'Extra 1',
      'Extras (2 ao 4)',
      'Total',
      'Status',
    ]
    const rows = filteredPayrolls.map((p) => {
      const extras = (p.extra_2 || 0) + (p.extra_3 || 0) + (p.extra_4 || 0)
      const d = new Date(p.reference_date)
      const comp = `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
      return [
        p.expand?.employee?.name || p.expand?.employee?.email || 'Desconhecido',
        comp,
        p.base_salary || 0,
        p.unit_value || 0,
        p.install_commission || 0,
        p.bonus || 0,
        p.extra_1 || 0,
        extras,
        p.total || 0,
        p.status,
      ]
        .map((v) => `"${v}"`)
        .join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `folha_pagamento_${format(new Date(), 'yyyyMMddHHmmss')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  const handleCloseMonth = async () => {
    const hasUnsaved = draftPayrolls.some((p) => p._isDraft || p._isModified)
    if (hasUnsaved) {
      toast({
        title: 'Aviso',
        description: 'Consolide o mês primeiro antes de fechar.',
        variant: 'destructive',
      })
      return
    }

    const unclosedRecords = draftPayrolls.filter((p) => !p.closed && p.id)
    if (unclosedRecords.length === 0) {
      toast({ title: 'Aviso', description: 'Não há registros abertos nesta competência.' })
      return
    }

    if (
      !confirm(
        `Tem certeza que deseja fechar o mês para ${unclosedRecords.length} registro(s)? Eles serão bloqueados contra alterações.`,
      )
    ) {
      return
    }

    setIsClosingMonth(true)
    try {
      await Promise.all(
        unclosedRecords.map((p) => pb.collection('payroll').update(p.id, { closed: true })),
      )

      setDraftPayrolls((prev) =>
        prev.map((p) => {
          if (unclosedRecords.some((ur) => ur.id === p.id)) {
            return { ...p, closed: true }
          }
          return p
        }),
      )

      const [y, m] = filterMonth.split('-')
      const startOfMo = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, 1, 0, 0, 0)).toISOString()
      const competenceStr = getHeaderCompetence(startOfMo)

      await logAudit('fechar_mes', `Competência ${competenceStr} fechada.`)

      toast({ title: 'Sucesso', description: 'Mês fechado com sucesso.' })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao fechar o mês.',
        variant: 'destructive',
      })
    } finally {
      setIsClosingMonth(false)
    }
  }

  const handleRevertMonth = async () => {
    if (!confirm('Tem certeza que deseja estornar o mês? Isso reabrirá os registros para edição.'))
      return

    setIsRevertingMonth(true)
    try {
      const [yStr, mStr] = filterMonth.split('-')
      const y = parseInt(yStr, 10)
      const m = parseInt(mStr, 10) - 1

      const startOfMo = new Date(Date.UTC(y, m, 1, 0, 0, 0)).toISOString()
      const endOfMo = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0)).toISOString()

      const recordsToRevert = await pb.collection('payroll').getFullList({
        filter: `reference_date >= '${startOfMo}' && reference_date < '${endOfMo}' && closed = true`,
      })

      if (recordsToRevert.length > 0) {
        await Promise.all(
          recordsToRevert.map((p) =>
            pb.collection('payroll').update(p.id, { closed: false, status: 'Pendente' }),
          ),
        )
      }

      // Force clean state before fetching to prevent ghost data
      setDraftPayrolls([])
      setReceiptRecord(null)
      setIsOpen(false)

      await loadMonthData()

      const competenceStr = getHeaderCompetence(startOfMo)

      await logAudit('estornar_mes', `Competência ${competenceStr} estornada.`)

      toast({
        title: 'Sucesso',
        description: 'Mês estornado com sucesso.',
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao estornar o mês.',
        variant: 'destructive',
      })
    } finally {
      setIsRevertingMonth(false)
    }
  }

  const filteredPayrolls = draftPayrolls.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (filterUser !== 'all' && p.employee !== filterUser) return false
    return true
  })

  const hasClosedRecords = draftPayrolls.some((p) => p.closed)
  const hasOpenRecords = draftPayrolls.some((p) => !p.closed)

  const getHeaderCompetence = (isoString: string) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    const m = format(d, 'MMMM yyyy', { locale: ptBR })
    let formatted = m.charAt(0).toUpperCase() + m.slice(1)
    return formatted.replace(' de ', ' ')
  }

  const fmtC = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const totalProventos = filteredPayrolls.reduce((sum, p) => sum + (p.total || 0), 0)

  return (
    <>
      <div className="space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-medium tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Banknote className="w-6 h-6 text-primary" />
              Folha de Pagamento
            </h2>
            <p className="text-slate-500 text-sm">Gerencie salários e comissões da equipe.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConsolidate}
              disabled={isConsolidating}
            >
              {isConsolidating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Gravar Mês (Consolidar)
            </Button>
            <Button onClick={() => openForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Lançamento
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex-wrap items-end">
          <div className="flex-1 min-w-[150px] space-y-2">
            <Label>Mês/Ano de Competência</Label>
            <Input type="month" value={filterMonth} onChange={handleMonthChange} />
          </div>
          <div className="flex-1 min-w-[150px] space-y-2">
            <Label className="flex items-center">
              Qtde Install
              <InfoTooltip text="Quantidade geral multiplicada pelo Valor do Install de cada colaborador para calcular o Incentivo." />
            </Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Ex: 10"
              value={globalQty}
              onChange={(e) => handleGlobalQtyChange(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[200px] space-y-2">
            <Label>Colaborador</Label>
            <Select
              value={filterUser}
              onValueChange={(val) => {
                setFilterUser(val)
                if (val !== 'all') {
                  setSearchParams({ user: val })
                } else {
                  setSearchParams({})
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[150px] space-y-2">
            <Label>Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Pago">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl bg-white/50 backdrop-blur-sm shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b-slate-100 dark:border-b-slate-800">
              <TableRow>
                <TableHead className="font-medium text-slate-500">Colaborador</TableHead>
                <TableHead className="font-medium text-slate-500">Competência</TableHead>
                <TableHead className="font-medium text-slate-500 hidden md:table-cell">
                  Status
                </TableHead>
                <TableHead className="text-right font-medium text-slate-500 hidden sm:table-cell">
                  Valor Install
                </TableHead>
                <TableHead className="text-right font-medium text-slate-500 hidden sm:table-cell">
                  Incentivo
                </TableHead>
                <TableHead className="text-right font-medium text-slate-500">Total</TableHead>
                <TableHead className="text-right font-medium text-slate-500">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredPayrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayrolls.map((p) => {
                  const isUnsaved = p._isDraft || p._isModified
                  return (
                    <TableRow key={p.id || p.employee}>
                      <TableCell className="font-medium">
                        {p.expand?.employee?.name || p.expand?.employee?.email || 'Desconhecido'}
                      </TableCell>
                      <TableCell>{getHeaderCompetence(p.reference_date)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant={p.status === 'Pago' ? 'default' : 'secondary'}
                          className={
                            p.status === 'Pago' ? 'bg-emerald-500 hover:bg-emerald-600' : ''
                          }
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-700 dark:text-slate-300 hidden sm:table-cell">
                        {fmtC(p.unit_value || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-700 dark:text-slate-300 hidden sm:table-cell">
                        {fmtC(p.install_commission || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-700 dark:text-slate-300">
                        {fmtC(p.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 items-center">
                          {isUnsaved && !p.closed && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                              onClick={() => handleSaveRow(p)}
                              disabled={savingRowId === p.employee}
                              title="Gravar Individual"
                            >
                              {savingRowId === p.employee ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setReceiptRecord(p)}
                            title="Gerar Recibo"
                          >
                            <Printer className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openForm(p)}
                            title={p.closed ? 'Visualizar (Fechado)' : 'Editar'}
                          >
                            <Edit className="w-4 h-4 text-slate-500" />
                          </Button>
                          {!p.closed && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(p)}
                              title="Excluir"
                              className="hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Banknote className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 flex items-center">
                Total de Proventos
                <InfoTooltip text="Soma de todos os pagamentos consolidados na tela atual." />
              </p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {fmtC(totalProventos)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {hasClosedRecords && (
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={handleRevertMonth}
                disabled={isClosingMonth || isRevertingMonth}
              >
                {isRevertingMonth ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                Estornar Mês
              </Button>
            )}
            <Button
              variant="default"
              onClick={handleCloseMonth}
              disabled={isClosingMonth || isRevertingMonth || !hasOpenRecords}
            >
              {isClosingMonth ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fechando...
                </>
              ) : (
                'Fechar Mês'
              )}
            </Button>
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={(v) => setIsOpen(v)}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRecord
                  ? editingRecord.closed
                    ? 'Visualizar Lançamento'
                    : 'Editar Lançamento'
                  : 'Novo Lançamento'}
              </DialogTitle>
              <DialogDescription>
                {editingRecord?.closed
                  ? 'Este lançamento está fechado e não pode ser editado.'
                  : 'Preencha os valores financeiros. O Incentivo e o Total são calculados automaticamente.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Colaborador *</Label>
                <Select
                  value={employee}
                  onValueChange={setEmployee}
                  disabled={editingRecord?.closed || editingRecord}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select value={status} onValueChange={setStatus} disabled={editingRecord?.closed}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Pago">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="space-y-2">
                  <Label className="flex items-center">
                    Salário Base
                    <InfoTooltip text="Valor fixo do salário do colaborador." />
                  </Label>
                  <Input
                    type="text"
                    value={formatCurrencyInput(baseSalary)}
                    onChange={(e) => setBaseSalary(parseCurrencyInput(e.target.value))}
                    disabled={editingRecord?.closed}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center">
                    Valor do Install
                    <InfoTooltip text="Valor unitário por install. Multiplica pela Qtde Install para gerar o Incentivo." />
                  </Label>
                  <Input
                    type="text"
                    value={formatCurrencyInput(unitValue)}
                    onChange={(e) => handleUnitValueChange(e.target.value)}
                    disabled={editingRecord?.closed}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center">
                    Incentivo (Automático)
                    <InfoTooltip text="Valor calculado automaticamente (Valor Install x Qtde Install)." />
                  </Label>
                  <Input
                    type="text"
                    value={formatCurrencyInput(installComm)}
                    readOnly
                    className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center">
                    Bônus
                    <InfoTooltip text="Bonificações extras por desempenho." />
                  </Label>
                  <Input
                    type="text"
                    value={formatCurrencyInput(bonus)}
                    onChange={(e) => setBonus(parseCurrencyInput(e.target.value))}
                    disabled={editingRecord?.closed}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="space-y-2">
                  <Label className="flex items-center">
                    Extra 1
                    <InfoTooltip text="Valores adicionais diversos." />
                  </Label>
                  <Input
                    type="text"
                    value={formatCurrencyInput(extra1)}
                    onChange={(e) => setExtra1(parseCurrencyInput(e.target.value))}
                    disabled={editingRecord?.closed}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center">
                    Extra 2
                    <InfoTooltip text="Valores adicionais diversos (Ex: Ajuda de Custo)." />
                  </Label>
                  <Input
                    type="text"
                    value={formatCurrencyInput(extra2)}
                    onChange={(e) => setExtra2(parseCurrencyInput(e.target.value))}
                    disabled={editingRecord?.closed}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center">
                    Extra 3
                    <InfoTooltip text="Valores adicionais diversos." />
                  </Label>
                  <Input
                    type="text"
                    value={formatCurrencyInput(extra3)}
                    onChange={(e) => setExtra3(parseCurrencyInput(e.target.value))}
                    disabled={editingRecord?.closed}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center">
                    Extra 4
                    <InfoTooltip text="Valores adicionais diversos." />
                  </Label>
                  <Input
                    type="text"
                    value={formatCurrencyInput(extra4)}
                    onChange={(e) => setExtra4(parseCurrencyInput(e.target.value))}
                    disabled={editingRecord?.closed}
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <Label>Observações</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white/50 px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/50"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  disabled={editingRecord?.closed}
                  placeholder="Anotações internas..."
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mt-4 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center">
                  Total a Pagar
                  <InfoTooltip text="Soma de todos os proventos (Valor calculado automaticamente)." />
                </span>
                <span className="text-2xl font-semibold text-primary">
                  {fmtC(
                    (baseSalary || 0) +
                      (installComm || 0) +
                      (bonus || 0) +
                      (extra1 || 0) +
                      (extra2 || 0) +
                      (extra3 || 0) +
                      (extra4 || 0),
                  )}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                {editingRecord?.closed ? 'Fechar' : 'Cancelar'}
              </Button>
              {!editingRecord?.closed && (
                <Button onClick={handleSaveToMemory}>Salvar na Lista</Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!receiptRecord} onOpenChange={(open) => !open && setReceiptRecord(null)}>
          <DialogContent className="sm:max-w-md print:hidden">
            <DialogHeader>
              <DialogTitle>Visualizar Recibo</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 shadow-sm text-slate-800 dark:text-slate-200">
                <div className="text-center mb-6">
                  <h3 className="font-bold text-lg">RECIBO DE PAGAMENTO</h3>
                  <p className="text-sm text-slate-500">
                    Competência:{' '}
                    {receiptRecord ? getHeaderCompetence(receiptRecord.reference_date) : ''}
                  </p>
                </div>
                <div className="space-y-2 text-sm border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Colaborador:</span>
                    <span className="font-medium">
                      {receiptRecord?.expand?.employee?.name ||
                        receiptRecord?.expand?.employee?.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span>{receiptRecord?.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Data de Emissão:</span>
                    <span>{format(new Date(), 'dd/MM/yyyy')}</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                  {!!receiptRecord?.base_salary && (
                    <div className="flex justify-between">
                      <span>Salário Base</span>
                      <span>{fmtC(receiptRecord.base_salary)}</span>
                    </div>
                  )}
                  {!!receiptRecord?.install_commission && (
                    <div className="flex justify-between">
                      <span>Incentivo</span>
                      <span>{fmtC(receiptRecord.install_commission)}</span>
                    </div>
                  )}
                  {!!receiptRecord?.bonus && (
                    <div className="flex justify-between">
                      <span>Bônus</span>
                      <span>{fmtC(receiptRecord.bonus)}</span>
                    </div>
                  )}
                  {!!receiptRecord?.extra_1 && (
                    <div className="flex justify-between">
                      <span>Extra 1</span>
                      <span>{fmtC(receiptRecord.extra_1)}</span>
                    </div>
                  )}
                  {!!receiptRecord?.extra_2 && (
                    <div className="flex justify-between">
                      <span>Extra 2</span>
                      <span>{fmtC(receiptRecord.extra_2)}</span>
                    </div>
                  )}
                  {!!receiptRecord?.extra_3 && (
                    <div className="flex justify-between">
                      <span>Extra 3</span>
                      <span>{fmtC(receiptRecord.extra_3)}</span>
                    </div>
                  )}
                  {!!receiptRecord?.extra_4 && (
                    <div className="flex justify-between">
                      <span>Extra 4</span>
                      <span>{fmtC(receiptRecord.extra_4)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-lg font-bold text-lg text-primary">
                  <span>Total</span>
                  <span>{receiptRecord ? fmtC(receiptRecord.total) : ''}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReceiptRecord(null)}>
                Fechar
              </Button>
              <Button onClick={handlePrintReceipt}>
                <Printer className="w-4 h-4 mr-2" /> Imprimir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {receiptRecord && (
        <>
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #receipt-print-section, #receipt-print-section * { visibility: visible; }
              #receipt-print-section {
                position: absolute; left: 0; top: 0; width: 100%; margin: 0;
              }
            }
          `}</style>
          <div
            id="receipt-print-section"
            className="hidden print:block bg-white text-black p-8 max-w-2xl mx-auto border-2 border-black rounded-xl m-10"
          >
            <div className="text-center mb-8 border-b-2 border-black pb-6">
              <h1 className="text-3xl font-bold uppercase tracking-wider text-black">
                Recibo de Pagamento
              </h1>
              <p className="text-lg mt-2 text-slate-700">
                Competência: {getHeaderCompetence(receiptRecord.reference_date)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8 text-lg">
              <div>
                <p className="text-slate-500 text-sm uppercase font-semibold tracking-wider">
                  Colaborador
                </p>
                <p className="font-bold text-xl">
                  {receiptRecord?.expand?.employee?.name || receiptRecord?.expand?.employee?.email}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-sm uppercase font-semibold tracking-wider">
                  Data de Emissão
                </p>
                <p className="font-bold text-xl">{format(new Date(), 'dd/MM/yyyy')}</p>
              </div>
            </div>

            <div className="border-t-2 border-black py-6 mb-8">
              <table className="w-full text-xl">
                <tbody>
                  {!!receiptRecord?.base_salary && (
                    <tr>
                      <td className="py-2 text-slate-700">Salário Base</td>
                      <td className="text-right font-semibold">
                        {fmtC(receiptRecord.base_salary)}
                      </td>
                    </tr>
                  )}
                  {!!receiptRecord?.install_commission && (
                    <tr>
                      <td className="py-2 text-slate-700">Incentivo</td>
                      <td className="text-right font-semibold">
                        {fmtC(receiptRecord.install_commission)}
                      </td>
                    </tr>
                  )}
                  {!!receiptRecord?.bonus && (
                    <tr>
                      <td className="py-2 text-slate-700">Bônus</td>
                      <td className="text-right font-semibold">{fmtC(receiptRecord.bonus)}</td>
                    </tr>
                  )}
                  {!!receiptRecord?.extra_1 && (
                    <tr>
                      <td className="py-2 text-slate-700">Extra 1</td>
                      <td className="text-right font-semibold">{fmtC(receiptRecord.extra_1)}</td>
                    </tr>
                  )}
                  {!!receiptRecord?.extra_2 && (
                    <tr>
                      <td className="py-2 text-slate-700">Extra 2</td>
                      <td className="text-right font-semibold">{fmtC(receiptRecord.extra_2)}</td>
                    </tr>
                  )}
                  {!!receiptRecord?.extra_3 && (
                    <tr>
                      <td className="py-2 text-slate-700">Extra 3</td>
                      <td className="text-right font-semibold">{fmtC(receiptRecord.extra_3)}</td>
                    </tr>
                  )}
                  {!!receiptRecord?.extra_4 && (
                    <tr>
                      <td className="py-2 text-slate-700">Extra 4</td>
                      <td className="text-right font-semibold">{fmtC(receiptRecord.extra_4)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center bg-slate-100 p-6 rounded-lg font-bold text-3xl border-2 border-black mb-24">
              <span>TOTAL PAGO</span>
              <span>{fmtC(receiptRecord.total)}</span>
            </div>

            <div className="text-center pb-8">
              <div className="w-3/4 mx-auto border-t-2 border-black pt-4">
                <p className="text-xl font-bold uppercase tracking-wider">
                  Assinatura do Colaborador
                </p>
                <p className="text-lg text-slate-600 mt-1">
                  {receiptRecord?.expand?.employee?.name || receiptRecord?.expand?.employee?.email}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
