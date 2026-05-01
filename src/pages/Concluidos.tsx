import { useApp } from '@/contexts/app-context'
import { ClienteList } from '@/components/clientes/cliente-list'
import { startOfMonth } from 'date-fns'

const Concluidos = () => {
  const { clients, statusList, reverseClientBaixa } = useApp()
  const baixaStatusId = statusList.find((s) => s.name === 'Baixa')?.id

  const thisMonthStart = startOfMonth(new Date())

  const completedClients = clients
    .filter(
      (c) => c.statusId === baixaStatusId && c.dataBaixa && new Date(c.dataBaixa) >= thisMonthStart,
    )
    .sort((a, b) => new Date(b.dataBaixa!).getTime() - new Date(a.dataBaixa!).getTime())

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-emerald-600">Concluídos do Mês</h2>
        <p className="text-muted-foreground text-sm">
          Clientes que receberam baixa neste mês vigente.
        </p>
      </div>

      <ClienteList
        clients={completedClients}
        onEdit={() => {}}
        onDelete={() => {}}
        onBaixa={() => {}}
        onReverse={reverseClientBaixa}
      />
    </div>
  )
}

export default Concluidos
