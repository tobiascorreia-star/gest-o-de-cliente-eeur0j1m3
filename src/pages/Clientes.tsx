import { useState, useEffect, useMemo } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { getClients, deleteClient, updateClient } from '@/services/clients'
import { getConfigurations } from '@/services/configurations'
import { ClienteList } from '@/components/clientes/cliente-list'
import { ClienteForm } from '@/components/clientes/cliente-form'
import { Client } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { startOfMonth } from 'date-fns'

export default function Clientes() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [alertSettings, setAlertSettings] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('ativos')
  const { toast } = useToast()
  const { user } = useAuth()

  const loadData = async () => {
    try {
      const [clientsData, alertData] = await Promise.all([
        getClients(),
        pb
          .collection('alert_settings')
          .getFirstListItem('')
          .catch(() => null),
      ])
      setClients(clientsData)
      setAlertSettings(alertData)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('clients', loadData)
  useRealtime('alert_settings', loadData)

  const filteredClients = useMemo(() => {
    let result = clients
    if (search) {
      const lowerSearch = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.nome_cliente.toLowerCase().includes(lowerSearch) ||
          c.razao_social.toLowerCase().includes(lowerSearch) ||
          c.cnpj.includes(search),
      )
    }
    if (dateFilter) {
      result = result.filter((c) => {
        if (!c.created) return false
        return c.created.startsWith(dateFilter)
      })
    }
    return result
  }, [clients, search, dateFilter])

  const thisMonthStart = startOfMonth(new Date())

  const activeClients = useMemo(() => {
    return filteredClients.filter((c) => {
      const statusName = c.expand?.status?.name?.toUpperCase() || ''
      return statusName !== 'BAIXA'
    })
  }, [filteredClients])

  const completedClients = useMemo(() => {
    return filteredClients
      .filter((c) => {
        const statusName = c.expand?.status?.name?.toUpperCase() || ''
        if (statusName !== 'BAIXA') return false
        const updatedDate = new Date(c.updated)
        return updatedDate >= thisMonthStart
      })
      .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())
  }, [filteredClients, thisMonthStart])

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      try {
        await deleteClient(id)
        toast({ title: 'Excluído', description: 'Cliente excluído com sucesso.' })
      } catch (e) {
        toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
      }
    }
  }

  const handleBaixa = async (id: string) => {
    try {
      const client = clients.find((c) => c.id === id)
      if (!client) throw new Error('Cliente não encontrado.')

      const configs = await getConfigurations()
      const baixaStatus = configs.find(
        (c: any) => c.type?.toUpperCase() === 'STATUS' && c.name?.toUpperCase() === 'BAIXA',
      )
      if (!baixaStatus) throw new Error('Status BAIXA não encontrado nas configurações.')

      await updateClient(id, {
        status: baixaStatus.id,
        previous_status: client.status || null,
      })

      try {
        await pb.collection('audit_logs').create({
          action: 'Baixa',
          user: user?.id,
          details: `Cliente ${client.nome_cliente} marcado como BAIXA.`,
        })
      } catch (err) {
        console.error('Falha ao criar log de auditoria para baixa', err)
      }

      toast({ title: 'Sucesso', description: 'Baixa realizada.' })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao realizar baixa.',
        variant: 'destructive',
      })
    }
  }

  const handleEstorno = async (id: string) => {
    try {
      const client = clients.find((c) => c.id === id)
      if (!client) throw new Error('Cliente não encontrado.')

      const previousStatus = client.previous_status || ''

      await updateClient(id, {
        status: previousStatus,
        previous_status: null,
      })

      try {
        await pb.collection('audit_logs').create({
          action: 'Estorno',
          user: user?.id,
          details: `Baixa do cliente ${client.nome_cliente} estornada.`,
        })
      } catch (err) {
        console.error('Falha ao criar log de auditoria para estorno', err)
      }

      toast({ title: 'Sucesso', description: 'Estorno realizado.' })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao realizar estorno.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestão de Clientes</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie todos os clientes e suas solicitações.
          </p>
        </div>
        {!isFormOpen && (
          <Button
            onClick={() => {
              setEditingClient(null)
              setIsFormOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Cliente
          </Button>
        )}
      </div>

      {!isFormOpen && (
        <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, razão social ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-muted/30"
            />
          </div>
          <div className="w-full sm:w-auto">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-muted/30"
              title="Filtrar por data de criação"
            />
          </div>
        </div>
      )}

      {isFormOpen ? (
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
          </h3>
          <ClienteForm
            initialData={editingClient}
            onSuccess={() => setIsFormOpen(false)}
            onCancel={() => setIsFormOpen(false)}
          />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
          <TabsList>
            <TabsTrigger value="ativos">Clientes Ativos ({activeClients.length})</TabsTrigger>
            <TabsTrigger value="concluidos">
              Concluídos do Mês ({completedClients.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ativos" className="m-0">
            <ClienteList
              clients={activeClients}
              alertSettings={alertSettings}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBaixa={handleBaixa}
            />
          </TabsContent>

          <TabsContent value="concluidos" className="m-0">
            <ClienteList
              clients={completedClients}
              alertSettings={alertSettings}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBaixa={handleBaixa}
              onReverse={handleEstorno}
              isRestrictedArea={true}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
