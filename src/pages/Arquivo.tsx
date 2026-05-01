import { useApp } from '@/contexts/app-context'
import { ClienteList } from '@/components/clientes/cliente-list'
import { startOfMonth, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Client } from '@/types'

const Arquivo = () => {
  const { clients, statusList, deleteClient, markClientAsCompleted, reverseClientBaixa } = useApp()
  const baixaStatusId = statusList.find((s) => s.name === 'Baixa')?.id

  const thisMonthStart = startOfMonth(new Date())

  const archivedClients = clients
    .filter(
      (c) => c.statusId === baixaStatusId && c.dataBaixa && new Date(c.dataBaixa) < thisMonthStart,
    )
    .sort((a, b) => new Date(b.dataBaixa!).getTime() - new Date(a.dataBaixa!).getTime())

  const groupedClients = archivedClients.reduce(
    (groups, client) => {
      if (!client.dataBaixa) return groups
      const monthStr = format(new Date(client.dataBaixa), 'MMMM yyyy', { locale: ptBR })
      const month = monthStr.charAt(0).toUpperCase() + monthStr.slice(1)

      if (!groups[month]) groups[month] = []
      groups[month].push(client)
      return groups
    },
    {} as Record<string, Client[]>,
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Arquivo</h2>
        <p className="text-muted-foreground text-sm">
          Histórico de clientes com baixa em meses anteriores organizados por mês.
        </p>
      </div>

      {Object.keys(groupedClients).length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-md bg-card">
          Nenhum cliente arquivado encontrado.
        </div>
      ) : (
        Object.entries(groupedClients).map(([month, monthClients]) => (
          <div key={month} className="space-y-3">
            <h3 className="text-lg font-semibold bg-muted/40 p-2 rounded-md border-b">{month}</h3>
            <ClienteList
              clients={monthClients}
              onEdit={() => {}}
              onDelete={deleteClient}
              onBaixa={markClientAsCompleted}
              onReverse={reverseClientBaixa}
              isRestrictedArea={true}
            />
          </div>
        ))
      )}
    </div>
  )
}

export default Arquivo
