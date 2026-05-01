import { useApp } from '@/contexts/app-context'
import { ClienteList } from '@/components/clientes/cliente-list'
import { startOfMonth } from 'date-fns'

const Arquivo = () => {
  const { clients, statusList, deleteClient, markClientAsCompleted } = useApp()
  const baixaStatusId = statusList.find((s) => s.name === 'Baixa')?.id

  const thisMonthStart = startOfMonth(new Date())

  const archivedClients = clients
    .filter(
      (c) => c.statusId === baixaStatusId && c.dataBaixa && new Date(c.dataBaixa) < thisMonthStart,
    )
    .sort((a, b) => new Date(b.dataBaixa!).getTime() - new Date(a.dataBaixa!).getTime())

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Arquivo</h2>
        <p className="text-muted-foreground text-sm">
          Histórico de clientes com baixa em meses anteriores.
        </p>
      </div>

      <ClienteList
        clients={archivedClients}
        onEdit={() => {}}
        onDelete={deleteClient}
        onBaixa={markClientAsCompleted}
      />
    </div>
  )
}

export default Arquivo
