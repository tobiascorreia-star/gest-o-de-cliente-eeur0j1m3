import { useState, useEffect } from 'react'
import { ClienteList } from '@/components/clientes/cliente-list'
import { ClienteForm } from '@/components/clientes/cliente-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Search } from 'lucide-react'
import { Client } from '@/types'
import { getClients, deleteClient as apiDeleteClient, updateClient } from '@/services/clients'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

const Clientes = () => {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const loadClients = async () => {
    try {
      const data = await getClients()
      setClients(data)
    } catch (error) {
      console.error('Failed to load clients', error)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  useRealtime('clients', () => {
    loadClients()
  })

  useRealtime('configurations', () => {
    loadClients()
  })

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase()
    return (
      (c.razao_social || '').toLowerCase().includes(term) ||
      (c.cnpj || '').includes(term) ||
      (c.nome_cliente || '').toLowerCase().includes(term)
    )
  })

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteClient(id)
      toast({ title: 'Sucesso', description: 'Cliente excluído com sucesso.' })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o cliente.',
        variant: 'destructive',
      })
    }
  }

  const handleBaixa = async (id: string) => {
    try {
      const statusBaixa = await pb
        .collection('configurations')
        .getFirstListItem(`type='Status' && name='Baixa'`)
      if (statusBaixa) {
        await updateClient(id, { status: statusBaixa.id })
        toast({ title: 'Sucesso', description: 'Cliente atualizado para Baixa.' })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Status Baixa não encontrado ou erro na atualização.',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setIsFormOpen(true)
  }

  const handleOpenChange = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) setEditingClient(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie o cadastro e os status de seus clientes.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
              <DialogDescription>
                Preencha os dados do cliente. Todos os campos com exceção de Observações são
                obrigatórios.
              </DialogDescription>
            </DialogHeader>
            <ClienteForm initialData={editingClient} onSuccess={() => handleOpenChange(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por Razão Social, CNPJ ou Cliente..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ClienteList
        clients={filteredClients}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBaixa={handleBaixa}
      />
    </div>
  )
}

export default Clientes
