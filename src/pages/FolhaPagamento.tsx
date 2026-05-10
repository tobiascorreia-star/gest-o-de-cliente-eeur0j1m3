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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Plus, Printer, Edit, Trash2, Banknote, Loader2, Save, Info, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { useRealtime } from '@/hooks/use-realtime'
import { ptBR } from 'date-fns/locale'
import { logAudit } from '@/services/audit'
import { Switch } from '@/components/ui/switch'

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
  const [savingRowId, setSavingRowId] = useState<string | null>(null)
  const [isClosingMonth, setIsClosingMonth] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isClearAllOpen, setIsClearAllOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const [editingRecord, setEditingRecord] = useState<any>(null)

  const [employee, setEmployee] = useState('')
  const [baseSalary, setBaseSalary] = useState<number | null>(null)
  const [unitValue, setUnitValue] = useState<number | null>(null)
  const [currentQtde, setCurrentQtde] = useState<number>(0)
  const [manualInstallQty, setManualInstallQty] = useState(false)
  const [bonus, setBonus] = useState<number | null>(null)
  const [desconto, setDesconto] = useState<number | null>(null)
  const [extra1, setExtra1] = useState<number | null>(null)
  const [extra2, setExtra2] = useState<number | null>(null)
  const [extra3, setExtra3] = useState<number | null>(null)
  const [extra4, setExtra4] = useState<number | null>(null)
  const [status, setStatus] = useState('pendente')
  const [observations, setObservations] = useState('')
  const [isClosed, setIsClosed] = useState(false)
  const [incentivo, setIncentivo] = useState<number>(0)
  const [totalValue, setTotalValue] = useState<number>(0)

  const [receiptRecord, setReceiptRecord] = useState<any>(null)

  useEffect(() => {
    if (!manualInstallQty) {
      setIncentivo((unitValue || 0) * (currentQtde || 0))
    }
  }, [unitValue, currentQtde, manualInstallQty])

  useEffect(() => {
    const t =
      (baseSalary || 0) +
      (incentivo || 0) +
      (bonus || 0) +
      (extra1 || 0) +
      (extra2 || 0) +
      (extra3 || 0) +
      (extra4 || 0) -
      (desconto || 0)
    setTotalValue(t)
  }, [baseSalary, incentivo, bonus, desconto, extra1, extra2, extra3, extra4])

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
      const m = parseInt(mStr, 10)

      const startOfMo = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0)).toISOString()
      const endOfMo = new Date(Date.UTC(y, m, 1, 0, 0, 0)).toISOString()

      const filterStart = startOfMo.replace('T', ' ')
      const filterEnd = endOfMo.replace('T', ' ')

      const pData = await pb.collection('payroll').getFullList({
        filter: `ano_referencia = ${y} && mes_referencia = ${m}`,
        expand: 'colaborador',
        sort: '-created',
      })

      let qty = ''
      let sId = ''
      try {
        const sData = await pb
          .collection('payroll_settings')
          .getFirstListItem(`reference_date >= '${filterStart}' && reference_date < '${filterEnd}'`)
        qty = sData.quantity?.toString() || ''
        sId = sData.id
      } catch {
        /* intentionally ignored */
      }

      const qVal = parseFloat(qty) || 0

      const combined = pData.map((p) => {
        return {
          ...p,
          _isDraft: false,
          _isModified: false,
        }
      })

      setDraftPayrolls(combined)
      setGlobalQty(qty)
      setSettingsId(sId)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro de Conexão',
        description: 'Falha ao carregar dados. Verifique a internet e tente novamente.',
        variant: 'destructive',
      })
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

  useRealtime('payroll', () => {
    const hasUnsaved = draftPayrolls.some((p) => p._isDraft || p._isModified)
    if (!hasUnsaved) {
      loadMonthData()
    }
  })

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hasUnsaved = draftPayrolls.some(
      (p) => (p._isDraft || p._isModified) && !(p.closed || p.status === 'pago'),
    )
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
    const intVal = val.replace(/\D/g, '')
    setGlobalQty(intVal)
    const q = parseInt(intVal, 10) || 0
    setDraftPayrolls((prev) =>
      prev.map((p) => {
        if (p.closed || p.status === 'pago') return p

        if (p.manual_install_qty) {
          return p
        }

        const unit = p.unit_value || 0
        const calculatedIncentivo = unit * q
        const total =
          (p.base_salary || 0) +
          calculatedIncentivo +
          (p.bonus || 0) +
          (p.extra_1 || 0) +
          (p.extra_2 || 0) +
          (p.extra_3 || 0) +
          (p.extra_4 || 0) -
          (p.desconto || 0)

        return {
          ...p,
          qtde_install: q,
          install_commission: calculatedIncentivo,
          incentivo: calculatedIncentivo,
          total_a_pagar: total,
          _isModified: true,
        }
      }),
    )
  }

  const openForm = (p?: any) => {
    if (p) {
      const isActuallyClosed = p.closed || p.status === 'pago'
      const isManual = p.manual_install_qty || false
      const dbQtde = p.qtde_install || 0

      setEditingRecord({ ...p, closed: isActuallyClosed })
      setEmployee(p.colaborador)
      setBaseSalary(p.base_salary ?? null)
      setUnitValue(p.unit_value ?? null)
      setCurrentQtde(dbQtde)
      setManualInstallQty(isManual)
      setBonus(p.bonus ?? null)
      setDesconto(p.desconto ?? null)
      setExtra1(p.extra_1 ?? null)
      setExtra2(p.extra_2 ?? null)
      setExtra3(p.extra_3 ?? null)
      setExtra4(p.extra_4 ?? null)
      setStatus(p.status || 'pendente')
      setObservations(p.observacoes || '')
      setIsClosed(isActuallyClosed)
      setIncentivo(p.incentivo ?? p.install_commission ?? 0)
      setTotalValue(p.total_a_pagar || 0)
    } else {
      const q = parseInt(globalQty, 10) || 0
      setEditingRecord(null)
      setEmployee(filterUser !== 'all' ? filterUser : '')
      setBaseSalary(null)
      setUnitValue(null)
      setCurrentQtde(q)
      setManualInstallQty(false)
      setBonus(null)
      setDesconto(null)
      setExtra1(null)
      setExtra2(null)
      setExtra3(null)
      setExtra4(null)
      setStatus('pendente')
      setObservations('')
      setIsClosed(false)
      setIncentivo(0)
      setTotalValue(0)
    }
    setIsOpen(true)
  }

  const handleUnitValueChange = (val: string) => {
    const uv = parseCurrencyInput(val)
    setUnitValue(uv)
  }

  const handleSaveForm = async () => {
    if (!employee) {
      toast({ title: 'Erro', description: 'Selecione o colaborador.', variant: 'destructive' })
      return
    }

    if (
      Number.isNaN(currentQtde) ||
      (unitValue !== null && Number.isNaN(unitValue)) ||
      (incentivo !== null && Number.isNaN(incentivo))
    ) {
      toast({
        title: 'Erro de Validação',
        description: 'Valores numéricos inválidos.',
        variant: 'destructive',
      })
      return
    }

    const finalIncentivo = manualInstallQty ? (incentivo ?? 0) : (unitValue || 0) * currentQtde
    const finalTotal =
      (baseSalary || 0) +
      finalIncentivo +
      (bonus || 0) +
      (extra1 || 0) +
      (extra2 || 0) +
      (extra3 || 0) +
      (extra4 || 0) -
      (desconto || 0)

    const globalQ = parseFloat(globalQty) || 0

    const [y, m] = filterMonth.split('-')
    const ano_referencia = parseInt(y, 10)
    const mes_referencia = parseInt(m, 10)
    const startOfMo = new Date(
      Date.UTC(ano_referencia, mes_referencia - 1, 1, 0, 0, 0),
    ).toISOString()

    const data = {
      colaborador: employee,
      mes_referencia,
      ano_referencia,
      base_salary: baseSalary || 0,
      unit_value: unitValue || 0,
      qtde_install: currentQtde,
      manual_install_qty: manualInstallQty,
      install_commission: finalIncentivo,
      incentivo: finalIncentivo,
      bonus: bonus || 0,
      desconto: desconto || 0,
      extra_1: extra1 || 0,
      extra_2: extra2 || 0,
      extra_3: extra3 || 0,
      extra_4: extra4 || 0,
      total_a_pagar: finalTotal,
      status,
      observacoes: observations,
      closed: isClosed,
    }

    setIsSaving(true)
    try {
      let currentSettingsId = settingsId
      if (!currentSettingsId && globalQty !== '') {
        const s = await pb.collection('payroll_settings').create({
          reference_date: startOfMo,
          quantity: globalQ,
        })
        setSettingsId(s.id)
        currentSettingsId = s.id
      } else if (currentSettingsId && globalQty !== '') {
        await pb.collection('payroll_settings').update(currentSettingsId, {
          quantity: globalQ,
        })
      }

      if (editingRecord && editingRecord.id) {
        await pb.collection('payroll').update(editingRecord.id, data)
      } else {
        const exists = draftPayrolls.some(
          (p) => p.colaborador === employee && p.id !== editingRecord?.id,
        )
        if (exists) {
          toast({
            title: 'Erro de Validação',
            description: 'Colaborador já possui lançamento neste mês.',
            variant: 'destructive',
          })
          setIsSaving(false)
          return
        }
        await pb.collection('payroll').create(data)
      }

      toast({ title: 'Sucesso', description: 'Registro salvo com sucesso.' })
      setIsOpen(false)
      loadMonthData()
    } catch (e) {
      const msg = getErrorMessage(e)
      toast({
        title: 'Erro ao gravar',
        description: msg || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveRow = async (p: any) => {
    setSavingRowId(p.colaborador)
    try {
      let currentSettingsId = settingsId
      const [y, m] = filterMonth.split('-')
      const startOfMo = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, 1, 0, 0, 0)).toISOString()

      if (!currentSettingsId && globalQty !== '') {
        const s = await pb.collection('payroll_settings').create({
          reference_date: startOfMo,
          quantity: parseInt(globalQty, 10) || 0,
        })
        setSettingsId(s.id)
        currentSettingsId = s.id
      } else if (currentSettingsId) {
        await pb.collection('payroll_settings').update(currentSettingsId, {
          quantity: parseInt(globalQty, 10) || 0,
        })
      }

      const data = {
        colaborador: p.colaborador,
        mes_referencia: p.mes_referencia,
        ano_referencia: p.ano_referencia,
        base_salary: p.base_salary,
        unit_value: p.unit_value,
        qtde_install: p.qtde_install,
        manual_install_qty: p.manual_install_qty,
        install_commission: p.manual_install_qty
          ? (p.incentivo ?? p.install_commission ?? 0)
          : (p.unit_value || 0) * (p.qtde_install || 0),
        incentivo: p.manual_install_qty
          ? (p.incentivo ?? p.install_commission ?? 0)
          : (p.unit_value || 0) * (p.qtde_install || 0),
        bonus: p.bonus,
        desconto: p.desconto,
        extra_1: p.extra_1,
        extra_2: p.extra_2,
        extra_3: p.extra_3,
        extra_4: p.extra_4,
        total_a_pagar: p.total_a_pagar,
        status: p.status,
        observacoes: p.observacoes,
        closed: p.closed,
      }

      let saved
      if (p.id) {
        saved = await pb.collection('payroll').update(p.id, data, { expand: 'colaborador' })
      } else {
        saved = await pb.collection('payroll').create(data, { expand: 'colaborador' })
      }

      setDraftPayrolls((prev) =>
        prev.map((item) =>
          item === p ? { ...item, ...saved, _isDraft: false, _isModified: false } : item,
        ),
      )
      toast({ title: 'Sucesso', description: 'Registro gravado.' })
    } catch (e) {
      const msg = getErrorMessage(e)
      toast({
        title: 'Erro ao gravar',
        description: msg || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingRowId(null)
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
      prev.filter((item) => (p.id ? item.id !== p.id : item.colaborador !== p.colaborador)),
    )
  }

  const handleReopen = async (p: any) => {
    if (
      !confirm(
        'Deseja realmente reabrir este lançamento? Ele voltará para o status Pendente e poderá ser editado.',
      )
    )
      return
    try {
      const data = {
        closed: false,
        status: 'pendente',
      }
      const saved = await pb.collection('payroll').update(p.id, data, { expand: 'colaborador' })
      setDraftPayrolls((prev) =>
        prev.map((item) =>
          item.id === p.id ? { ...item, ...saved, _isDraft: false, _isModified: false } : item,
        ),
      )
      await logAudit(
        'reabrir_folha',
        `Lançamento de ${p.expand?.colaborador?.name || p.expand?.colaborador?.email} reaberto na competência ${getHeaderCompetence(p.mes_referencia, p.ano_referencia)}.`,
      )
      toast({ title: 'Sucesso', description: 'Lançamento reaberto com sucesso.' })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  const handleClearAll = async () => {
    setIsClearing(true)
    try {
      const records = await pb.collection('payroll').getFullList({ fields: 'id' })
      const batchSize = 50
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize)
        await Promise.all(batch.map((r) => pb.collection('payroll').delete(r.id)))
      }

      await logAudit(
        'bulk_delete_payroll',
        'Todos os registros da folha de pagamento foram apagados.',
      )

      toast({
        title: 'Sucesso',
        description: 'Todos os registros da folha de pagamento foram removidos com sucesso.',
      })
      setDraftPayrolls([])
      setIsClearAllOpen(false)
      loadMonthData()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setIsClearing(false)
    }
  }

  const handleCloseMonth = async () => {
    if (draftPayrolls.length === 0) {
      toast({ title: 'Aviso', description: 'Não há registros nesta competência para fechar.' })
      return
    }

    if (!confirm('Deseja fechar o mês atual e transportar as informações para o próximo mês?')) {
      return
    }

    setIsClosingMonth(true)
    try {
      let currentSettingsId = settingsId
      const [y, m] = filterMonth.split('-')
      const currentYear = parseInt(y, 10)
      const currentMonth = parseInt(m, 10)
      const startOfMo = new Date(Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0)).toISOString()

      let nextYear = currentYear
      let nextMonth = currentMonth + 1
      if (nextMonth > 12) {
        nextMonth = 1
        nextYear += 1
      }
      const nextFilterMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}`

      if (!currentSettingsId && globalQty !== '') {
        const s = await pb.collection('payroll_settings').create({
          reference_date: startOfMo,
          quantity: parseInt(globalQty, 10) || 0,
        })
        setSettingsId(s.id)
      } else if (currentSettingsId && globalQty !== '') {
        await pb.collection('payroll_settings').update(currentSettingsId, {
          quantity: parseInt(globalQty, 10) || 0,
        })
      }

      const updatedDrafts = [...draftPayrolls]
      for (let i = 0; i < updatedDrafts.length; i++) {
        const p = updatedDrafts[i]
        if (p.closed) continue

        const data = {
          colaborador: p.colaborador,
          mes_referencia: p.mes_referencia,
          ano_referencia: p.ano_referencia,
          base_salary: p.base_salary,
          unit_value: p.unit_value,
          qtde_install: p.qtde_install,
          manual_install_qty: p.manual_install_qty,
          install_commission: p.manual_install_qty
            ? (p.incentivo ?? p.install_commission ?? 0)
            : (p.unit_value || 0) * (p.qtde_install || 0),
          incentivo: p.manual_install_qty
            ? (p.incentivo ?? p.install_commission ?? 0)
            : (p.unit_value || 0) * (p.qtde_install || 0),
          bonus: p.bonus,
          desconto: p.desconto,
          extra_1: p.extra_1,
          extra_2: p.extra_2,
          extra_3: p.extra_3,
          extra_4: p.extra_4,
          total_a_pagar: p.total_a_pagar,
          status: 'pago',
          observacoes: p.observacoes,
          closed: true,
        }

        let saved
        if (p.id) {
          saved = await pb.collection('payroll').update(p.id, data, { expand: 'colaborador' })
        } else {
          saved = await pb.collection('payroll').create(data, { expand: 'colaborador' })
        }
        updatedDrafts[i] = { ...p, ...saved, _isDraft: false, _isModified: false }
      }

      setDraftPayrolls(updatedDrafts)

      const existingNextMonth = await pb.collection('payroll').getFullList({
        filter: `ano_referencia = ${nextYear} && mes_referencia = ${nextMonth}`,
        fields: 'id,colaborador,status,closed',
      })
      const existingEmployeeMap = new Map(existingNextMonth.map((r) => [r.colaborador, r]))

      for (let i = 0; i < updatedDrafts.length; i++) {
        const p = updatedDrafts[i]
        const employeeObj = users.find((u) => u.id === p.colaborador)
        if (employeeObj && employeeObj.active === false) {
          continue
        }

        const existingRecord = existingEmployeeMap.get(p.colaborador)
        if (existingRecord && (existingRecord.closed || existingRecord.status === 'pago')) {
          continue
        }

        const newQtdeInstall = 0
        const newManualInstallQty = false
        const newInstallCommission = 0
        const newIncentivo = 0
        const newBonus = p.bonus || 0
        const newDesconto = 0
        const newExtra1 = 0
        const newExtra2 = 0
        const newExtra3 = 0
        const newExtra4 = 0
        const newObservacoes = p.observacoes || ''

        const newTotal = (p.base_salary || 0) + newBonus

        const nextMonthData = {
          colaborador: p.colaborador,
          mes_referencia: nextMonth,
          ano_referencia: nextYear,
          base_salary: p.base_salary || 0,
          unit_value: p.unit_value || 0,
          qtde_install: newQtdeInstall,
          manual_install_qty: newManualInstallQty,
          install_commission: newInstallCommission,
          incentivo: newIncentivo,
          bonus: newBonus,
          desconto: newDesconto,
          extra_1: newExtra1,
          extra_2: newExtra2,
          extra_3: newExtra3,
          extra_4: newExtra4,
          total_a_pagar: newTotal,
          status: 'pendente',
          observacoes: newObservacoes,
          closed: false,
        }

        if (existingRecord) {
          await pb.collection('payroll').update(existingRecord.id, {
            base_salary: p.base_salary || 0,
            unit_value: p.unit_value || 0,
            qtde_install: newQtdeInstall,
            manual_install_qty: newManualInstallQty,
            install_commission: newInstallCommission,
            incentivo: newIncentivo,
            bonus: newBonus,
            desconto: newDesconto,
            extra_1: newExtra1,
            extra_2: newExtra2,
            extra_3: newExtra3,
            extra_4: newExtra4,
            total_a_pagar: newTotal,
            observacoes: newObservacoes,
          })
        } else {
          await pb.collection('payroll').create(nextMonthData)
        }
      }

      const competenceStr = getHeaderCompetence(currentMonth, currentYear)
      const nextCompetenceStr = getHeaderCompetence(nextMonth, nextYear)
      await logAudit(
        'fechar_mes',
        `Competência ${competenceStr} fechada. Transporte realizado para ${nextCompetenceStr}.`,
      )

      toast({ title: 'Sucesso', description: 'Mês fechado e transportado com sucesso.' })
      setFilterMonth(nextFilterMonth)
    } catch (err) {
      console.error(err)
      const msg = getErrorMessage(err)
      toast({
        title: 'Erro',
        description: msg || 'Ocorreu um erro ao fechar o mês.',
        variant: 'destructive',
      })
    } finally {
      setIsClosingMonth(false)
    }
  }

  const filteredPayrolls = draftPayrolls.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (filterUser !== 'all' && p.colaborador !== filterUser) return false
    return true
  })

  const hasClosedRecords = draftPayrolls.some((p) => p.closed || p.status === 'pago')
  const hasOpenRecords = draftPayrolls.some((p) => !(p.closed || p.status === 'pago'))

  const getHeaderCompetence = (mes?: number, ano?: number) => {
    if (!mes || !ano) return ''
    const d = new Date(ano, mes - 1, 2)
    const m = format(d, 'MMMM yyyy', { locale: ptBR })
    let formatted = m.charAt(0).toUpperCase() + m.slice(1)
    return formatted.replace(' de ', ' ')
  }

  const fmtC = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const totalProventos = filteredPayrolls.reduce((sum, p) => sum + (p.total_a_pagar || 0), 0)

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
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-4 sm:mt-0">
            <Button onClick={() => openForm()} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Novo Lançamento
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsClearAllOpen(true)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Apagar Tudo
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex-wrap items-end">
          {loading && draftPayrolls.length === 0 ? (
            <>
              <div className="flex-1 min-w-[150px] space-y-2">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="flex-1 min-w-[150px] space-y-2">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="flex-1 min-w-[200px] space-y-2">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="flex-1 min-w-[150px] space-y-2">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            </>
          ) : (
            <>
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
                  placeholder="Ex: 10"
                  value={globalQty}
                  onChange={(e) => handleGlobalQtyChange(e.target.value)}
                  className="appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
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
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
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
                    <TableRow key={p.id || p.colaborador}>
                      <TableCell className="font-medium">
                        {p.expand?.colaborador?.name ||
                          p.expand?.colaborador?.email ||
                          'Desconhecido'}
                      </TableCell>
                      <TableCell>
                        {getHeaderCompetence(p.mes_referencia, p.ano_referencia)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant={p.status === 'pago' ? 'default' : 'secondary'}
                          className={
                            p.status === 'pago' ? 'bg-emerald-500 hover:bg-emerald-600' : ''
                          }
                        >
                          {p.status === 'pago' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-700 dark:text-slate-300 hidden sm:table-cell">
                        {fmtC(p.unit_value || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-700 dark:text-slate-300 hidden sm:table-cell">
                        {fmtC((p.incentivo ?? p.install_commission) || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-700 dark:text-slate-300">
                        {fmtC(p.total_a_pagar)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 items-center">
                          {isUnsaved && !(p.closed || p.status === 'pago') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                              onClick={() => handleSaveRow(p)}
                              disabled={savingRowId === p.colaborador}
                              title="Gravar Alterações"
                            >
                              {savingRowId === p.colaborador ? (
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
                            title={
                              p.closed || p.status === 'pago' ? 'Visualizar (Fechado)' : 'Editar'
                            }
                          >
                            <Edit className="w-4 h-4 text-slate-500" />
                          </Button>
                          {(p.closed || p.status === 'pago') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleReopen(p)}
                              title="Reabrir Folha"
                              className="hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            >
                              <RotateCcw className="w-4 h-4 text-orange-500" />
                            </Button>
                          )}
                          {!(p.closed || p.status === 'pago') && (
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
                      </TableCell>{' '}
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
            <Button
              variant="default"
              onClick={handleCloseMonth}
              disabled={isClosingMonth || draftPayrolls.length === 0}
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
                  : 'Preencha os valores financeiros. O Total é calculado automaticamente.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Colaborador *</Label>
                <Select
                  value={employee || undefined}
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
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
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
                    Qtde Install
                    <InfoTooltip text="Quantidade aplicada na base de cálculo. Ao alterar a Quantidade Geral, este valor será atualizado, a menos que o campo Incentivo esteja como Manual." />
                  </Label>
                  <Input
                    type="number"
                    value={currentQtde === 0 && !editingRecord ? '' : currentQtde}
                    onChange={(e) => {
                      const intVal = e.target.value.replace(/\D/g, '')
                      setCurrentQtde(parseInt(intVal, 10) || 0)
                    }}
                    disabled={editingRecord?.closed}
                    placeholder="Qtde..."
                    className="appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center justify-between">
                    <span className="flex items-center">
                      Incentivo
                      <InfoTooltip
                        text={
                          manualInstallQty
                            ? 'Valor manual. Não será calculado automaticamente.'
                            : 'Valor calculado automaticamente (Valor Install x Qtde Install).'
                        }
                      />
                    </span>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={manualInstallQty}
                        onCheckedChange={(checked) => {
                          setManualInstallQty(checked)
                          if (!checked) {
                            setIncentivo((unitValue || 0) * (currentQtde || 0))
                          }
                        }}
                        disabled={editingRecord?.closed}
                        className="scale-75"
                        id="incentivo-manual-switch"
                      />
                      <Label
                        htmlFor="incentivo-manual-switch"
                        className="text-xs text-slate-500 cursor-pointer"
                      >
                        Manual
                      </Label>
                    </div>
                  </Label>
                  <Input
                    type="text"
                    value={formatCurrencyInput(incentivo)}
                    onChange={(e) => {
                      setIncentivo(parseCurrencyInput(e.target.value) ?? 0)
                      if (!manualInstallQty) setManualInstallQty(true)
                    }}
                    disabled={editingRecord?.closed}
                    className={
                      !manualInstallQty
                        ? 'bg-slate-50 dark:bg-slate-900 font-semibold'
                        : 'bg-amber-50 dark:bg-amber-900/20 font-semibold border-amber-200 dark:border-amber-800'
                    }
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
                <div className="space-y-2">
                  <Label className="flex items-center text-red-500 font-medium">
                    Desconto
                    <InfoTooltip text="Valores descontados do total a pagar." />
                  </Label>
                  <Input
                    type="text"
                    value={formatCurrencyInput(desconto)}
                    onChange={(e) => setDesconto(parseCurrencyInput(e.target.value))}
                    disabled={editingRecord?.closed}
                    className="text-red-500 font-semibold border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10"
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
                <span className="text-2xl font-semibold text-primary">{fmtC(totalValue)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                {editingRecord?.closed ? 'Fechar' : 'Cancelar'}
              </Button>
              {!editingRecord?.closed && (
                <Button onClick={handleSaveForm} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Salvar
                </Button>
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
                    {receiptRecord
                      ? getHeaderCompetence(
                          receiptRecord.mes_referencia,
                          receiptRecord.ano_referencia,
                        )
                      : ''}
                  </p>
                </div>
                <div className="space-y-2 text-sm border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Colaborador:</span>
                    <span className="font-medium">
                      {receiptRecord?.expand?.colaborador?.name ||
                        receiptRecord?.expand?.colaborador?.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span>{receiptRecord?.status === 'pago' ? 'Pago' : 'Pendente'}</span>
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
                  {!!(receiptRecord?.incentivo ?? receiptRecord?.install_commission) && (
                    <div className="flex justify-between">
                      <span>Incentivo</span>
                      <span>
                        {fmtC(receiptRecord.incentivo ?? receiptRecord.install_commission)}
                      </span>
                    </div>
                  )}
                  {!!receiptRecord?.bonus && (
                    <div className="flex justify-between">
                      <span>Bônus</span>
                      <span>{fmtC(receiptRecord.bonus)}</span>
                    </div>
                  )}
                  {!!receiptRecord?.desconto && (
                    <div className="flex justify-between text-red-500 font-medium">
                      <span>Desconto</span>
                      <span>-{fmtC(receiptRecord.desconto)}</span>
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
                  <span>{receiptRecord ? fmtC(receiptRecord.total_a_pagar) : ''}</span>
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

      <AlertDialog open={isClearAllOpen} onOpenChange={setIsClearAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar todos os registros</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente apagar todos os registros da folha de pagamento? Esta ação é
              irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleClearAll} disabled={isClearing}>
              {isClearing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirmar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                Competência:{' '}
                {getHeaderCompetence(receiptRecord.mes_referencia, receiptRecord.ano_referencia)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8 text-lg">
              <div>
                <p className="text-slate-500 text-sm uppercase font-semibold tracking-wider">
                  Colaborador
                </p>
                <p className="font-bold text-xl">
                  {receiptRecord?.expand?.colaborador?.name ||
                    receiptRecord?.expand?.colaborador?.email}
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
                  {!!(receiptRecord?.incentivo ?? receiptRecord?.install_commission) && (
                    <tr>
                      <td className="py-2 text-slate-700">Incentivo</td>
                      <td className="text-right font-semibold">
                        {fmtC(receiptRecord.incentivo ?? receiptRecord.install_commission)}
                      </td>
                    </tr>
                  )}
                  {!!receiptRecord?.bonus && (
                    <tr>
                      <td className="py-2 text-slate-700">Bônus</td>
                      <td className="text-right font-semibold">{fmtC(receiptRecord.bonus)}</td>
                    </tr>
                  )}
                  {!!receiptRecord?.desconto && (
                    <tr>
                      <td className="py-2 text-red-600 font-medium">Desconto</td>
                      <td className="text-right font-semibold text-red-600">
                        -{fmtC(receiptRecord.desconto)}
                      </td>
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
              <span>{fmtC(receiptRecord.total_a_pagar)}</span>
            </div>

            <div className="text-center pb-8">
              <div className="w-3/4 mx-auto border-t-2 border-black pt-4">
                <p className="text-xl font-bold uppercase tracking-wider">
                  Assinatura do Colaborador
                </p>
                <p className="text-lg text-slate-600 mt-1">
                  {receiptRecord?.expand?.colaborador?.name ||
                    receiptRecord?.expand?.colaborador?.email}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
