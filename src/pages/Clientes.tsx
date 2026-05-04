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
import pb from '@/lib/pocketbase/client'

export default function Clientes() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [alertSettings, setAlertSettings] = useState<any>(null)
  const { toast } = useToast()

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
        // Filters using the explicit created field (YYYY-MM-DD string match prefix)
        return c.created.startsWith(dateFilter)
      })
    }
    return result
  }, [clients, search, dateFilter])

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
      const configs = await getConfigurations()
      const baixaStatus = configs.find(
        (c: any) => c.type === 'Status' && c.name.toUpperCase() === 'BAIXA',
      )
      if (!baixaStatus) throw new Error('Status BAIXA não encontrado nas configurações.')

      await updateClient(id, { status: baixaStatus.id })
      toast({ title: 'Sucesso', description: 'Baixa realizada.' })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao realizar baixa.',
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
        <ClienteList
          clients={filteredClients}
          alertSettings={alertSettings}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBaixa={handleBaixa}
        />
      )}
    </div>
  )
}
