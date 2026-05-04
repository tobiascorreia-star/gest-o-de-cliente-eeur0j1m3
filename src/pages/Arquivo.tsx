import { useState, useEffect, useMemo } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { getClients, deleteClient, updateClient } from '@/services/clients'
import { ClienteList } from '@/components/clientes/cliente-list'
import { Client } from '@/types'
import { startOfMonth, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export default function Arquivo() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const { toast } = useToast()
  const { user } = useAuth()

  const loadData = async () => {
    try {
      const data = await getClients()
      setClients(data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('clients', loadData)

  const thisMonthStart = startOfMonth(new Date())

  const archivedClients = useMemo(() => {
    let result = clients.filter((c) => {
      const statusName = c.expand?.status?.name?.toUpperCase() || ''
      if (statusName !== 'BAIXA') return false
      const baixaDate = c.data_baixa ? new Date(c.data_baixa) : new Date(c.updated)
      return baixaDate < thisMonthStart
    })

    if (search) {
      const lowerSearch = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.nome_cliente.toLowerCase().includes(lowerSearch) ||
          c.razao_social.toLowerCase().includes(lowerSearch) ||
          c.cnpj.includes(search),
      )
    }

    return result.sort((a, b) => {
      const dateA = a.data_baixa ? new Date(a.data_baixa) : new Date(a.updated)
      const dateB = b.data_baixa ? new Date(b.data_baixa) : new Date(b.updated)
      return dateB.getTime() - dateA.getTime()
    })
  }, [clients, search, thisMonthStart])

  const groupedClients = useMemo(() => {
    return archivedClients.reduce(
      (groups, client) => {
        const date = client.data_baixa ? new Date(client.data_baixa) : new Date(client.updated)
        const monthStr = format(date, 'MMMM yyyy', { locale: ptBR })
        const month = monthStr.charAt(0).toUpperCase() + monthStr.slice(1)

        if (!groups[month]) groups[month] = []
        groups[month].push(client)
        return groups
      },
      {} as Record<string, Client[]>,
    )
  }, [archivedClients])

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir permanentemente este registro?')) {
      try {
        await deleteClient(id)
        toast({ title: 'Excluído', description: 'Cliente excluído com sucesso do arquivo.' })
      } catch (e) {
        toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
      }
    }
  }

  const handleEstorno = async (id: string) => {
    if (
      confirm(
        'Tem certeza que deseja estornar a baixa deste cliente? O registro retornará aos ativos.',
      )
    ) {
      try {
        const client = clients.find((c) => c.id === id)
        if (!client) throw new Error('Cliente não encontrado.')

        const previousStatus = client.previous_status || ''

        await updateClient(id, {
          status: previousStatus,
          previous_status: null,
          data_baixa: '',
        })

        try {
          await pb.collection('audit_logs').create({
            action: 'Estorno',
            user: user?.id,
            details: `Baixa do cliente ${client.nome_cliente} estornada a partir do arquivo.`,
          })
        } catch (err) {
          console.error('Falha ao criar log de auditoria para estorno', err)
        }

        toast({ title: 'Sucesso', description: 'Estorno realizado. Cliente retornou aos ativos.' })
      } catch (error: any) {
        toast({
          title: 'Erro',
          description: error.message || 'Falha ao realizar estorno.',
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Arquivo Histórico</h2>
        <p className="text-muted-foreground text-sm">
          Histórico de clientes com baixa em meses anteriores, organizados por mês e ano.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar no arquivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-muted/30"
          />
        </div>
      </div>

      {Object.keys(groupedClients).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-xl bg-card shadow-sm">
          Nenhum cliente arquivado encontrado.
        </div>
      ) : (
        <Accordion
          type="multiple"
          className="space-y-4"
          defaultValue={Object.keys(groupedClients).slice(0, 1)}
        >
          {Object.entries(groupedClients).map(([month, monthClients]) => (
            <AccordionItem
              key={month}
              value={month}
              className="bg-card border rounded-xl overflow-hidden shadow-sm"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 data-[state=open]:border-b">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold">{month}</span>
                  <span className="text-sm font-normal text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                    {monthClients.length} {monthClients.length === 1 ? 'cliente' : 'clientes'}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="p-4 md:p-6 bg-slate-50/30 dark:bg-slate-900/30">
                  <ClienteList
                    clients={monthClients}
                    onEdit={() => {}}
                    onDelete={handleDelete}
                    onBaixa={() => {}}
                    onReverse={handleEstorno}
                    isRestrictedArea={true}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
