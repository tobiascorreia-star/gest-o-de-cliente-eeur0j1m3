import { useState } from 'react'
import { useApp } from '@/contexts/app-context'
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

const Clientes = () => {
  const { clients, deleteClient, markClientAsCompleted } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase()
    return (
      c.razaoSocial.toLowerCase().includes(term) ||
      c.cnpj.includes(term) ||
      c.nome.toLowerCase().includes(term)
    )
  })

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
        onDelete={deleteClient}
        onBaixa={markClientAsCompleted}
      />
    </div>
  )
}

export default Clientes
