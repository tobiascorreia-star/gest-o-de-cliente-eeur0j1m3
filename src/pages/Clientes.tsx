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
import { startOfMonth, differenceInCalendarDays } from 'date-fns'
import { getClientAlertState } from '@/lib/utils'

export default function Clientes() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [showOnlyPendingOld, setShowOnlyPendingOld] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [alertSettings, setAlertSettings] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('ativos')
  const [notifications, setNotifications] = useState<any[]>([])
  const { toast } = useToast()
  const { user } = useAuth()

  const loadData = async () => {
    try {
      const isAdmin = typeof user?.role === 'string' && user.role.toLowerCase() === 'admin'
      const [clientsData, alertData, notificationsData] = await Promise.all([
        getClients(),
        pb
          .collection('alert_settings')
          .getFirstListItem('')
          .catch(() => null),
        isAdmin
          ? pb
              .collection('notifications')
              .getFullList({ filter: "type='atraso_cliente' && resolved=false" })
              .catch(() => [])
          : Promise.resolve([]),
      ])
      setClients(clientsData)
      setAlertSettings(alertData)
      setNotifications(notificationsData)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (user?.id) {
      pb.collection('users')
        .update(user.id, { last_clients_check: new Date().toISOString() })
        .catch(console.error)
    }
  }, [user?.id])

  useRealtime('clients', loadData)
  useRealtime('alert_settings', loadData)
  useRealtime(
    'notifications',
    (e) => {
      const isAdmin = typeof user?.role === 'string' && user.role.toLowerCase() === 'admin'
      if (e.record.type === 'atraso_cliente' && isAdmin) {
        if (e.action === 'create' || e.action === 'update') {
          if (e.record.resolved) {
            setNotifications((prev) => prev.filter((n) => n.id !== e.record.id))
          } else {
            setNotifications((prev) => {
              const exists = prev.find((n) => n.id === e.record.id)
              if (exists) return prev.map((n) => (n.id === e.record.id ? e.record : n))
              return [...prev, e.record]
            })
          }
        } else if (e.action === 'delete') {
          setNotifications((prev) => prev.filter((n) => n.id !== e.record.id))
        }
      }
    },
    typeof user?.role === 'string' && user.role.toLowerCase() === 'admin',
  )

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
    if (showOnlyPendingOld) {
      result = result.filter((c) => {
        const isAdmin = typeof user?.role === 'string' && user.role.toLowerCase() === 'admin'
        const { isCritical, isModerate, isOldAdmin } = getClientAlertState(
          c,
          alertSettings,
          isAdmin,
        )
        return isCritical || isModerate || isOldAdmin
      })
    }
    return result
  }, [clients, search, dateFilter, showOnlyPendingOld])

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
        const baixaDate = c.data_baixa ? new Date(c.data_baixa) : new Date(c.updated)
        return baixaDate >= thisMonthStart
      })
      .sort((a, b) => {
        const dateA = a.data_baixa ? new Date(a.data_baixa) : new Date(a.updated)
        const dateB = b.data_baixa ? new Date(b.data_baixa) : new Date(b.updated)
        return dateB.getTime() - dateA.getTime()
      })
  }, [filteredClients, thisMonthStart])

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      try {
        await deleteClient(id)
        toast({ title: 'Excluído', description: 'Atendimento excluído com sucesso.' })
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
        data_baixa: new Date().toISOString(),
      })

      try {
        await pb.collection('audit_logs').create({
          action: 'Baixa',
          user: user?.id,
          details: `Atendimento do cliente ${client.nome_cliente} marcado como BAIXA.`,
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
        data_baixa: '',
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
          <h2 className="text-2xl font-bold tracking-tight">Gestão de Atendimentos</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie todos os atendimentos e suas solicitações.
          </p>
        </div>
        {!isFormOpen && (
          <Button
            onClick={() => {
              setEditingClient(null)
              setIsFormOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Atendimento
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
          <div className="flex w-full sm:w-auto gap-2">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-muted/30"
              title="Filtrar por data de criação"
            />
            <Button
              variant={showOnlyPendingOld ? 'default' : 'outline'}
              onClick={() => setShowOnlyPendingOld(!showOnlyPendingOld)}
              className="whitespace-nowrap"
            >
              Apenas Pendentes (&gt;3 dias)
            </Button>
          </div>
        </div>
      )}

      {isFormOpen ? (
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            {editingClient ? 'Editar Atendimento' : 'Novo Atendimento'}
          </h3>
          <ClienteForm
            initialData={editingClient}
            onSuccess={() => setIsFormOpen(false)}
            onCancel={() => setIsFormOpen(false)}
          />
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full max-w-full space-y-4 overflow-hidden"
        >
          <TabsList className="w-full justify-start overflow-x-auto [&::-webkit-scrollbar]:hidden h-11 bg-muted/50 p-1 mb-2">
            <TabsTrigger value="ativos" className="flex-shrink-0">
              Atendimentos Ativos ({activeClients.length})
            </TabsTrigger>
            <TabsTrigger value="concluidos" className="flex-shrink-0">
              Concluídos do Mês ({completedClients.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ativos" className="m-0">
            <ClienteList
              clients={activeClients}
              alertSettings={alertSettings}
              notifications={notifications}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBaixa={handleBaixa}
            />
          </TabsContent>

          <TabsContent value="concluidos" className="m-0">
            <ClienteList
              clients={completedClients}
              alertSettings={alertSettings}
              notifications={notifications}
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
