import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
    id: 'reserva',
    title: 'Reserva de Futuro/Investimento',
    pct: 0.3,
    desc: 'Guardar para segurança',
    icon: PiggyBank,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'manutencao',
    title: 'Manutenção Residencial',
    pct: 0.2,
    desc: 'Aluguel, contas fixas',
    icon: Home,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    border: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'desenvolvimento',
    title: 'Desenvolvimento Pessoal',
    pct: 0.15,
    desc: 'Cursos, saúde',
    icon: BookOpen,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'qualidade',
    title: 'Qualidade de Vida/Diversão',
    pct: 0.1,
    desc: 'Lazer imediato',
    icon: Smile,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    border: 'border-amber-200 dark:border-amber-800',
  },
  {
    id: 'despesas',
    title: 'Despesas Variáveis',
    pct: 0.25,
    desc: 'Alimentação, transporte',
    icon: ShoppingCart,
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    border: 'border-rose-200 dark:border-rose-800',
  },
]

export default function SaudeFinanceira() {
  const { user } = useAuth()
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadRecord = async () => {
      if (!user || !filterMonth) return
      setLoading(true)
      try {
        const [yStr, mStr] = filterMonth.split('-')
        const y = parseInt(yStr, 10)
        const m = parseInt(mStr, 10)

        const data = await pb
          .collection('financial_education')
          .getFirstListItem(`user = "${user.id}" && year = ${y} && month = ${m}`)
        setRecord(data)
      } catch (err) {
        setRecord(null)
      } finally {
        setLoading(false)
      }
    }
    loadRecord()
  }, [filterMonth, user])

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

      <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="space-y-2">
          <Label>Selecione o Mês</Label>
          <Input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
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
              Nenhum dado encontrado para este mês.
            </p>
            <p>
              Os dados de saúde financeira deste mês ainda não foram liberados pelo administrador.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
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
              <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
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
