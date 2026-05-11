import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PiggyBank,
  Home,
  BookOpen,
  Smile,
  ShoppingCart,
  MessageSquareText,
  HeartHandshake,
  Loader2,
  Info,
} from 'lucide-react'

const rules = [
  {
    id: 'necessidades',
    title: 'Necessidades Básicas',
    pct: 0.5,
    desc: 'Gastos essenciais como aluguel, alimentação e contas fixas.',
    icon: Home,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    border: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'desejos',
    title: 'Desejos Pessoais',
    pct: 0.3,
    desc: 'Lazer, hobbies e gastos variáveis de estilo de vida.',
    icon: Smile,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    border: 'border-amber-200 dark:border-amber-800',
  },
  {
    id: 'investimentos',
    title: 'Investimentos e Futuro',
    pct: 0.2,
    desc: 'Reserva de emergência, investimentos e quitação de dívidas.',
    icon: PiggyBank,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
]

export default function SaudeFinanceira() {
  const { user } = useAuth()
  const [filterMonth, setFilterMonth] = useState('')
  const [availableMonths, setAvailableMonths] = useState<{ year: number; month: number }[]>([])
  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [payrollRecord, setPayrollRecord] = useState<any>(null)

  useEffect(() => {
    if (!user) return
    const fetchAvailable = async () => {
      try {
        const edFilter = `user = "${user.id}"`
        const prFilter = `colaborador = "${user.id}"`

        const [edRecords, prRecords] = await Promise.all([
          pb.collection('financial_education').getFullList({
            filter: edFilter,
            fields: 'year,month',
          }),
          pb.collection('payroll').getFullList({
            filter: prFilter,
            fields: 'ano_referencia,mes_referencia',
          }),
        ])
        const set = new Set<string>()
        const now = new Date()

        // Ensure current month is always an option in the dropdown
        set.add(`${now.getFullYear()}-${now.getMonth() + 1}`)

        edRecords.forEach((r) => set.add(`${r.year}-${r.month}`))
        prRecords.forEach((r) => set.add(`${r.ano_referencia}-${r.mes_referencia}`))

        const unique = Array.from(set).map((k) => {
          const [y, m] = k.split('-')
          return { year: parseInt(y, 10), month: parseInt(m, 10) }
        })
        // Sort descending (most recent first)
        unique.sort((a, b) => b.year - a.year || b.month - a.month)
        setAvailableMonths(unique)

        // Default to the most recent available month
        setFilterMonth(
          (prev) => prev || `${unique[0].year}-${String(unique[0].month).padStart(2, '0')}`,
        )
      } catch (e) {
        // ignore
      }
    }
    fetchAvailable()
  }, [user])

  useEffect(() => {
    if (!user || !filterMonth) return
    let isMounted = true

    const loadData = async () => {
      setLoading(true)
      try {
        const [yStr, mStr] = filterMonth.split('-')
        const y = parseInt(yStr, 10)
        const m = parseInt(mStr, 10)

        const [edData, prData] = await Promise.all([
          pb
            .collection('financial_education')
            .getFirstListItem(`user = "${user.id}" && year = ${y} && month = ${m}`)
            .catch(() => null),
          pb
            .collection('payroll')
            .getFirstListItem(
              `colaborador = "${user.id}" && ano_referencia = ${y} && mes_referencia = ${m}`,
            )
            .catch(() => null),
        ])

        if (isMounted) {
          setRecord(edData)
          setPayrollRecord(prData)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [filterMonth, user])

  useRealtime('financial_education', (e) => {
    const isRelevantForMonths = e.record.user === user?.id

    if (isRelevantForMonths) {
      if (e.action === 'create') {
        setAvailableMonths((prev) => {
          const exists = prev.some((m) => m.year === e.record.year && m.month === e.record.month)
          if (!exists) {
            const updated = [...prev, { year: e.record.year, month: e.record.month }]
            updated.sort((a, b) => b.year - a.year || b.month - a.month)
            return updated
          }
          return prev
        })
      }
    }

    if (e.record.user === user?.id) {
      if (filterMonth) {
        const [yStr, mStr] = filterMonth.split('-')
        const y = parseInt(yStr, 10)
        const m = parseInt(mStr, 10)
        if (e.record.year === y && e.record.month === m) {
          setRecord(e.action === 'delete' ? null : e.record)
        }
      }
    }
  })

  useRealtime('payroll', (e) => {
    const isRelevantForMonths = e.record.colaborador === user?.id

    if (isRelevantForMonths) {
      if (e.action === 'create') {
        setAvailableMonths((prev) => {
          const exists = prev.some(
            (m) => m.year === e.record.ano_referencia && m.month === e.record.mes_referencia,
          )
          if (!exists) {
            const updated = [
              ...prev,
              { year: e.record.ano_referencia, month: e.record.mes_referencia },
            ]
            updated.sort((a, b) => b.year - a.year || b.month - a.month)
            return updated
          }
          return prev
        })
      }
    }

    if (e.record.colaborador === user?.id) {
      if (filterMonth) {
        const [yStr, mStr] = filterMonth.split('-')
        const y = parseInt(yStr, 10)
        const m = parseInt(mStr, 10)
        if (e.record.ano_referencia === y && e.record.mes_referencia === m) {
          setPayrollRecord(e.action === 'delete' ? null : e.record)
        }
      }
    }
  })

  const fmtC = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Alert className="bg-primary/5 border-primary/20 text-primary-foreground dark:bg-primary/10 dark:text-primary-foreground">
        <HeartHandshake className="w-5 h-5 text-primary" />
        <AlertTitle className="text-lg font-semibold text-primary">
          Seja bem-vindo à MegaFllex, {user?.name || 'Colaborador'}!
        </AlertTitle>
        <AlertDescription className="text-primary/80 mt-1">
          Valorizamos seu esforço e desejamos que você faça uma boa distribuição dos seus proventos.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="space-y-2">
          <Label>Selecione o Mês</Label>
          <div className="flex items-center gap-4">
            {availableMonths.length > 0 ? (
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-[160px] bg-white dark:bg-slate-950">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((m) => {
                    const val = `${m.year}-${String(m.month).padStart(2, '0')}`
                    const monthNames = [
                      'janeiro',
                      'fevereiro',
                      'março',
                      'abril',
                      'maio',
                      'junho',
                      'julho',
                      'agosto',
                      'setembro',
                      'outubro',
                      'novembro',
                      'dezembro',
                    ]
                    const label = `${monthNames[m.month - 1]}/${m.year}`
                    return (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-auto bg-white dark:bg-slate-950"
              />
            )}
            {payrollRecord && (
              <Badge
                variant="outline"
                className={cn(
                  'text-sm font-semibold whitespace-nowrap border-2',
                  payrollRecord.closed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/60'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/60',
                )}
              >
                {payrollRecord.closed ? 'Folha Fechada' : 'Folha Aberta'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !record ? (
        <Card className="border-dashed shadow-none bg-transparent">
          <CardContent className="py-16 text-center text-slate-500">
            <Info className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
              Nenhum dado disponível para este período.
            </p>
            <p>
              Não foram encontrados registros de saúde financeira para o mês e ano selecionados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {payrollRecord && !payrollRecord.closed && (
            <Alert className="bg-amber-50/50 border-amber-200/60 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300 shadow-sm">
              <Info className="w-5 h-5 text-amber-500" />
              <AlertDescription className="font-medium mt-0.5">
                Os valores mostrados podem sofrer alterações até o fechamento da folha.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 md:col-span-3">
              <CardContent className="p-8 flex flex-col justify-center h-full">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary/80 mb-2">
                  Total a Receber
                </p>
                <p className="text-5xl md:text-6xl font-black text-primary">
                  {fmtC(record.net_value)}
                </p>
                <p className="text-sm text-slate-500 mt-4">
                  Sugerimos a seguinte divisão para manter sua saúde financeira em dia.
                </p>
              </CardContent>
            </Card>

            {record.admin_message && (
              <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 md:col-span-3">
                <CardHeader className="pb-2">
                  <CardTitle className="text-amber-800 dark:text-amber-500 flex items-center gap-2 text-base">
                    <MessageSquareText className="w-5 h-5" />
                    Mensagem do Gestor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-amber-900/80 dark:text-amber-200/80 text-sm leading-relaxed whitespace-pre-wrap">
                    "{record.admin_message}"
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule) => {
              const calculated = record.net_value * rule.pct
              const Icon = rule.icon
              return (
                <Card
                  key={rule.id}
                  className={`${rule.bg} ${rule.border} shadow-sm hover:shadow-md transition-shadow`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div
                        className={`p-2 rounded-lg bg-white/60 dark:bg-slate-900/60 ${rule.color}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300">
                        {rule.pct * 100}%
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                        {rule.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">
                        {rule.desc}
                      </p>
                      <p className={`text-2xl font-bold ${rule.color}`}>{fmtC(calculated)}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
