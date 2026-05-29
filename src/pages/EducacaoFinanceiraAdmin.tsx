import { useState, useEffect } from 'react'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Loader2, Edit, BookOpen, Download, User as UserIcon } from 'lucide-react'

export default function EducacaoFinanceiraAdmin() {
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [users, setUsers] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [netValue, setNetValue] = useState<string>('')
  const [adminMessage, setAdminMessage] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const uData = await pb
        .collection('users')
        .getFullList({ filter: 'active = true', sort: 'name' })
      setUsers(uData)

      if (filterMonth) {
        const [yStr, mStr] = filterMonth.split('-')
        const y = parseInt(yStr, 10)
        const m = parseInt(mStr, 10)

        const rData = await pb.collection('financial_education').getFullList({
          filter: `year = ${y} && month = ${m}`,
        })
        setRecords(rData)
      } else {
        setRecords([])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filterMonth])

  const handleOpenEdit = (user: any) => {
    const existingRecord = records.find((r) => r.user === user.id)
    setEditingUser(user)
    if (existingRecord) {
      setNetValue(existingRecord.net_value.toString())
      setAdminMessage(existingRecord.admin_message || '')
    } else {
      setNetValue('')
      setAdminMessage('')
    }
    setIsModalOpen(true)
  }

  const handleImportPayroll = async () => {
    if (!editingUser || !filterMonth) return
    setIsImporting(true)
    try {
      const [yStr, mStr] = filterMonth.split('-')
      const y = parseInt(yStr, 10)
      const m = parseInt(mStr, 10)

      const payrollData = await pb
        .collection('payroll')
        .getFirstListItem(
          `colaborador = "${editingUser.id}" && ano_referencia = ${y} && mes_referencia = ${m}`,
        )
      if (payrollData && payrollData.total_a_pagar) {
        setNetValue(payrollData.total_a_pagar.toString())
        toast({ title: 'Sucesso', description: 'Valor importado da folha de pagamento.' })
      } else {
        toast({
          title: 'Aviso',
          description: 'Não foi possível encontrar valor na folha para este mês.',
          variant: 'destructive',
        })
      }
    } catch (err) {
      toast({
        title: 'Aviso',
        description: 'Nenhum lançamento encontrado na folha para este mês.',
        variant: 'destructive',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleSave = async () => {
    if (!editingUser || !filterMonth) return
    const val = parseFloat(netValue)
    if (isNaN(val)) {
      toast({ title: 'Erro', description: 'Valor líquido inválido.', variant: 'destructive' })
      return
    }

    setIsSaving(true)
    try {
      const [yStr, mStr] = filterMonth.split('-')
      const y = parseInt(yStr, 10)
      const m = parseInt(mStr, 10)

      const existingRecord = records.find((r) => r.user === editingUser.id)

      const data = {
        user: editingUser.id,
        net_value: val,
        admin_message: adminMessage,
        month: m,
        year: y,
        sync_date: new Date().toISOString(),
      }

      if (existingRecord) {
        await pb.collection('financial_education').update(existingRecord.id, data)
      } else {
        await pb.collection('financial_education').create(data)
      }

      try {
        // Resolve operator alerts
        const alerts = await pb.collection('notifications').getFullList({
          filter: `user = "${editingUser.id}" && resolved = false && (type ~ "payroll_education" || type ~ "financial_education")`,
        })
        for (const alert of alerts) {
          await pb.collection('notifications').update(alert.id, { resolved: true })
        }

        // Resolve admin alerts
        const adminAlerts = await pb.collection('notifications').getFullList({
          filter: `resolved = false && type ~ "payroll_education_reminder"`,
        })
        for (const alert of adminAlerts) {
          const parts = alert.type.split('|')
          const alertMonth = parseInt(parts[1] || '0', 10)
          const alertYear = parseInt(parts[2] || '0', 10)
          const alertName = parts[3] || ''

          const isSamePeriod = alertMonth === m && alertYear === y

          const normalize = (str: string) => str.trim().toLowerCase()
          const safeName = editingUser.name ? normalize(editingUser.name) : null
          const safeEmail = editingUser.email ? normalize(editingUser.email) : null
          const normalizedAlertName = alertName ? normalize(alertName) : null

          const isSameUser =
            (normalizedAlertName && safeName && normalizedAlertName === safeName) ||
            (normalizedAlertName && safeEmail && normalizedAlertName === safeEmail) ||
            alert.type.includes(editingUser.id)

          if (isSamePeriod && isSameUser) {
            await pb.collection('notifications').update(alert.id, { resolved: true })
          }
        }
      } catch (err) {
        console.error('Erro ao resolver alertas:', err)
      }

      toast({
        title: 'Sucesso',
        description: 'Dados atualizados com sucesso e alertas associados resolvidos.',
      })
      setIsModalOpen(false)
      loadData()
    } catch (err) {
      const msg = getErrorMessage(err)
      toast({ title: 'Erro ao gravar', description: msg, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const fmtC = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Educação Financeira - Gestão
          </h2>
          <p className="text-slate-500 text-sm">
            Gerencie os valores líquidos e mensagens para a saúde financeira dos colaboradores.
          </p>
        </div>
      </div>

      <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex gap-4 items-end">
        <div className="space-y-2">
          <Label>Mês/Ano de Competência</Label>
          <Input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
        </div>
      </div>

      <div className="border border-slate-100 rounded-2xl bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b-slate-100 dark:border-b-slate-800">
            <TableRow>
              <TableHead className="font-medium text-slate-500">Colaborador</TableHead>
              <TableHead className="font-medium text-slate-500 text-right">Valor Líquido</TableHead>
              <TableHead className="font-medium text-slate-500">Mensagem do Gestor</TableHead>
              <TableHead className="font-medium text-slate-500 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum colaborador encontrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const record = records.find((r) => r.user === u.id)
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      {u.name || u.email}
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-700 dark:text-slate-300">
                      {record ? fmtC(record.net_value) : '-'}
                    </TableCell>
                    <TableCell className="text-slate-500 max-w-[200px] truncate">
                      {record?.admin_message || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(u)}>
                        <Edit className="w-4 h-4 mr-2" /> Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Dados - {editingUser?.name}</DialogTitle>
            <DialogDescription>
              Insira o valor líquido e uma mensagem para o colaborador neste mês.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valor Líquido Recebido</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={netValue}
                  onChange={(e) => setNetValue(e.target.value)}
                  placeholder="Ex: 2500.00"
                />
                <Button
                  variant="outline"
                  onClick={handleImportPayroll}
                  disabled={isImporting}
                  title="Importar total da Folha"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mensagem do Gestor (Nota)</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary dark:border-slate-800 dark:bg-slate-950"
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                placeholder="Mensagem motivacional ou conselho financeiro..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Atualizar Folha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
