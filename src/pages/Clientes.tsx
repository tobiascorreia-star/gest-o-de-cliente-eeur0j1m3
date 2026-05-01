import { useState } from 'react'
import { useApp } from '@/contexts/app-context'
import { ClienteList } from '@/components/clientes/cliente-list'
import { ClienteForm } from '@/components/clientes/cliente-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Plus, Search } from 'lucide-react'
import { Client } from '@/types'
import { toast } from '@/hooks/use-toast'

const Clientes = () => {
  const { clients, deleteClient, markClientAsCompleted } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const filteredClients = clients
    .filter(
      (c) =>
        c.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cnpj.includes(searchTerm),
    )
    .sort((a, b) => new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime())

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setIsSheetOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteClient(id)
      toast({ title: 'Excluído', description: 'Registro excluído com sucesso.' })
    }
  }

  const handleBaixa = (id: string) => {
    markClientAsCompleted(id)
    toast({ title: 'Baixa Realizada', description: 'O cliente foi marcado como concluído.' })
  }

  const handleOpenNew = () => {
    setEditingClient(null)
    setIsSheetOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground text-sm">Gerencie o banco de dados de clientes.</p>
        </div>
        <Button onClick={handleOpenNew} className="shrink-0 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Novo Cliente
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por Razão Social ou CNPJ..."
            className="pl-9 bg-card"
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

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</SheetTitle>
            <SheetDescription>Preencha os dados abaixo para salvar o registro.</SheetDescription>
          </SheetHeader>
          <ClienteForm initialData={editingClient} onSuccess={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default Clientes
