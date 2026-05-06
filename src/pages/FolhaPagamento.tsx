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
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Plus, Download, Printer, Edit, Trash2, Banknote, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function FolhaPagamento() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialUserId = searchParams.get('user')

  const [payrolls, setPayrolls] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [filterMonth, setFilterMonth] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterUser, setFilterUser] = useState(initialUserId || 'all')

  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isClosingMonth, setIsClosingMonth] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)

  const [employee, setEmployee] = useState('')
  const [refDate, setRefDate] = useState('')
  const [baseSalary, setBaseSalary] = useState('0')
  const [installComm, setInstallComm] = useState('0')
  const [bonus, setBonus] = useState('0')
  const [extra1, setExtra1] = useState('0')
  const [extra2, setExtra2] = useState('0')
  const [extra3, setExtra3] = useState('0')
  const [extra4, setExtra4] = useState('0')
  const [status, setStatus] = useState('Pendente')
  const [observations, setObservations] = useState('')

  const [receiptRecord, setReceiptRecord] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const pData = await pb.collection('payroll').getFullList({
        expand: 'employee',
        sort: '-reference_date',
      })
      setPayrolls(pData)

      const uData = await pb.collection('users').getFullList({
        filter: 'active = true',
        sort: 'name',
      })
      setUsers(uData)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro', description: 'Falha ao carregar dados.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [initialUserId])
  useRealtime('payroll', () => loadData())

  const totalCalculated =
    (parseFloat(baseSalary) || 0) +
    (parseFloat(installComm) || 0) +
    (parseFloat(bonus) || 0) +
    (parseFloat(extra1) || 0) +
    (parseFloat(extra2) || 0) +
    (parseFloat(extra3) || 0) +
    (parseFloat(extra4) || 0)

  const openForm = (record?: any) => {
    if (record) {
      setEditingRecord(record)
      setEmployee(record.employee)
      const d = new Date(record.reference_date)
      setRefDate(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
      setBaseSalary(record.base_salary?.toString() || '0')
      setInstallComm(record.install_commission?.toString() || '0')
      setBonus(record.bonus?.toString() || '0')
      setExtra1(record.extra_1?.toString() || '0')
      setExtra2(record.extra_2?.toString() || '0')
      setExtra3(record.extra_3?.toString() || '0')
      setExtra4(record.extra_4?.toString() || '0')
      setStatus(record.status)
      setObservations(record.observations || '')
    } else {
      setEditingRecord(null)
      setEmployee(filterUser !== 'all' ? filterUser : '')
      const now = new Date()
      setRefDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
      setBaseSalary('0')
      setInstallComm('0')
      setBonus('0')
      setExtra1('0')
      setExtra2('0')
      setExtra3('0')
      setExtra4('0')
      setStatus('Pendente')
      setObservations('')
    }
    setIsOpen(true)
  }

  const formatCurrencyInput = (val: string | number) => {
    const num = typeof val === 'number' ? val : parseFloat(val || '0')
    if (isNaN(num)) return fmtC(0)
    return fmtC(num)
  }

  const parseCurrencyInput = (val: string) => {
    let v = val.replace(/\D/g, '')
    if (v === '') v = '0'
    return (parseInt(v, 10) / 100).toString()
  }

  const handleSave = async () => {
    if (!employee || !refDate || !status) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }
    setIsSaving(true)
    try {
      const data = {
        employee,
        reference_date: new Date(`${refDate}-01T12:00:00Z`).toISOString(),
        base_salary: parseFloat(baseSalary) || 0,
        install_commission: parseFloat(installComm) || 0,
        bonus: parseFloat(bonus) || 0,
        extra_1: parseFloat(extra1) || 0,
        extra_2: parseFloat(extra2) || 0,
        extra_3: parseFloat(extra3) || 0,
        extra_4: parseFloat(extra4) || 0,
        total: totalCalculated,
        status,
        observations,
      }

      if (editingRecord) {
        await pb.collection('payroll').update(editingRecord.id, data)
        toast({ title: 'Sucesso', description: 'Registro atualizado com sucesso.' })
      } else {
        await pb.collection('payroll').create(data)
        toast({ title: 'Sucesso', description: 'Registro criado com sucesso.' })
      }
      setIsOpen(false)
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao salvar.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return
    try {
      await pb.collection('payroll').delete(id)
      toast({ title: 'Sucesso', description: 'Registro excluído.' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
    }
  }

  const handleExportCSV = () => {
    const headers = [
      'Colaborador',
      'Competência',
      'Salário Base',
      'Comissões',
      'Bônus',
      'Extras',
      'Total',
      'Status',
    ]
    const rows = filteredPayrolls.map((p) => {
      const extras = (p.extra_1 || 0) + (p.extra_2 || 0) + (p.extra_3 || 0) + (p.extra_4 || 0)
      const d = new Date(p.reference_date)
      const comp = `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
      return [
        p.expand?.employee?.name || p.expand?.employee?.email || 'Desconhecido',
        comp,
        p.base_salary,
        p.install_commission,
        p.bonus,
        extras,
        p.total,
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

  const filteredPayrolls = payrolls.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (filterUser !== 'all' && p.employee !== filterUser) return false
    if (filterMonth) {
      const d = new Date(p.reference_date)
      const pMonth = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
      if (pMonth !== filterMonth) return false
    }
    return true
  })

  const handleCloseMonth = async () => {
    const unclosedRecords = filteredPayrolls.filter((p) => !p.closed)
    if (unclosedRecords.length === 0) {
      toast({ title: 'Aviso', description: 'Não há registros abertos nos filtros atuais.' })
      return
    }

    if (
      !confirm(
        `Tem certeza que deseja fechar o mês para ${unclosedRecords.length} registro(s)? Eles serão bloqueados contra alterações e exclusões.`,
      )
    ) {
      return
    }

    setIsClosingMonth(true)
    try {
      for (const p of unclosedRecords) {
        await pb.collection('payroll').update(p.id, { closed: true })
      }
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
              Exportar CSV
            </Button>
            <Button onClick={() => openForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Lançamento
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex-wrap">
          <div className="flex-1 min-w-[150px] space-y-2">
            <Label>Mês/Ano de Competência</Label>
            <Input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
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
          <div className="flex items-end pb-1">
            <Button
              variant="ghost"
              onClick={() => {
                setFilterMonth('')
                setFilterStatus('all')
                setFilterUser('all')
                setSearchParams({})
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl bg-white/50 backdrop-blur-sm shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b-slate-100 dark:border-b-slate-800">
              <TableRow>
                <TableHead className="font-medium text-slate-500">Colaborador</TableHead>
                <TableHead className="font-medium text-slate-500">Competência</TableHead>
                <TableHead className="font-medium text-slate-500">Status</TableHead>
                <TableHead className="text-right font-medium text-slate-500">Total</TableHead>
                <TableHead className="text-right font-medium text-slate-500">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredPayrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayrolls.map((p) => {
                  const d = new Date(p.reference_date)
                  const monthName = format(d, 'MMMM/yyyy', { locale: ptBR })
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.expand?.employee?.name || p.expand?.employee?.email || 'Desconhecido'}
                      </TableCell>
                      <TableCell className="capitalize">{monthName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={p.status === 'Pago' ? 'default' : 'secondary'}
                          className={
                            p.status === 'Pago' ? 'bg-emerald-500 hover:bg-emerald-600' : ''
                          }
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-700 dark:text-slate-300">
                        {fmtC(p.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
                              onClick={() => handleDelete(p.id)}
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
              <p className="text-sm font-medium text-slate-500">Total de Proventos</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {fmtC(totalProventos)}
              </p>
            </div>
          </div>
          <div>
            <Button variant="default" onClick={handleCloseMonth} disabled={isClosingMonth}>
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

        <Dialog open={isOpen} onOpenChange={(v) => !isSaving && setIsOpen(v)}>
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
                  : 'Preencha os valores financeiros. O total é calculado automaticamente.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Colaborador *</Label>
                <Select
                  value={employee}
                  onValueChange={setEmployee}
                  disabled={editingRecord?.closed}
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
                  <Label>Competência *</Label>
                  <Input
                    type="month"
                    value={refDate}
                    onChange={(e) => setRefDate(e.target.value)}
                    disabled={editingRecord?.closed}
                  />
                </div>
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

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="space-y-2">
                  <Label>Salário Base</Label>
                  <Input
                    type="text"
                    value={formatCurrencyInput(baseSalary)}
                    onChange={(e) => setBaseSalary(parseCurrencyInput(e.target.value))}
                    disabled={editingRecord?.closed}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Comissões</Label>
                  <Input
                    type="text"
                    value={formatCurrencyInput(installComm)}
                    onChange={(e) => setInstallComm(parseCurrencyInput(e.target.value))}
                    disabled={editingRecord?.closed}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bônus</Label>
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
                  <Label>Extra 1</Label>
                  <Input
                    type="text"
                    value={formatCurrencyInput(extra1)}
                    onChange={(e) => setExtra1(parseCurrencyInput(e.target.value))}
                    disabled={editingRecord?.closed}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Extra 2</Label>
                  <Input
                    type="text"
                    value={formatCurrencyInput(extra2)}
                    onChange={(e) => setExtra2(parseCurrencyInput(e.target.value))}
                    disabled={editingRecord?.closed}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Extra 3</Label>
                  <Input
                    type="text"
                    value={formatCurrencyInput(extra3)}
                    onChange={(e) => setExtra3(parseCurrencyInput(e.target.value))}
                    disabled={editingRecord?.closed}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Extra 4</Label>
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
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  disabled={editingRecord?.closed}
                  placeholder="Anotações internas..."
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mt-4 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  Total a Pagar
                </span>
                <span className="text-2xl font-semibold text-primary">{fmtC(totalCalculated)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
                {editingRecord?.closed ? 'Fechar' : 'Cancelar'}
              </Button>
              {!editingRecord?.closed && (
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
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
                  <p className="text-sm text-slate-500 capitalize">
                    Competência:{' '}
                    {receiptRecord
                      ? format(new Date(receiptRecord.reference_date), 'MMMM/yyyy', {
                          locale: ptBR,
                        })
                      : ''}
                  </p>
                </div>
                <div className="space-y-2 text-sm border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Colaborador:</span>{' '}
                    <span className="font-medium">
                      {receiptRecord?.expand?.employee?.name ||
                        receiptRecord?.expand?.employee?.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>{' '}
                    <span>{receiptRecord?.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Data de Emissão:</span>{' '}
                    <span>{format(new Date(), 'dd/MM/yyyy')}</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                  {!!receiptRecord?.base_salary && (
                    <div className="flex justify-between">
                      <span>Salário Base</span> <span>{fmtC(receiptRecord.base_salary)}</span>
                    </div>
                  )}
                  {!!receiptRecord?.install_commission && (
                    <div className="flex justify-between">
                      <span>Comissões</span> <span>{fmtC(receiptRecord.install_commission)}</span>
                    </div>
                  )}
                  {!!receiptRecord?.bonus && (
                    <div className="flex justify-between">
                      <span>Bônus</span> <span>{fmtC(receiptRecord.bonus)}</span>
                    </div>
                  )}
                  {!!receiptRecord?.extra_1 && (
                    <div className="flex justify-between">
                      <span>Extra 1</span> <span>{fmtC(receiptRecord.extra_1)}</span>
                    </div>
                  )}
                  {!!receiptRecord?.extra_2 && (
                    <div className="flex justify-between">
                      <span>Extra 2</span> <span>{fmtC(receiptRecord.extra_2)}</span>
                    </div>
                  )}
                  {!!receiptRecord?.extra_3 && (
                    <div className="flex justify-between">
                      <span>Extra 3</span> <span>{fmtC(receiptRecord.extra_3)}</span>
                    </div>
                  )}
                  {!!receiptRecord?.extra_4 && (
                    <div className="flex justify-between">
                      <span>Extra 4</span> <span>{fmtC(receiptRecord.extra_4)}</span>
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
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
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
              <p className="text-lg mt-2 capitalize text-slate-700">
                Competência:{' '}
                {format(new Date(receiptRecord.reference_date), 'MMMM/yyyy', { locale: ptBR })}
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
                      <td className="py-2 text-slate-700">Comissões</td>
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
