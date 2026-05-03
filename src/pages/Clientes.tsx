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
import { getAlertSettings } from '@/services/alert_settings'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { differenceInDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Clock, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

const Clientes = () => {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [alertSettings, setAlertSettings] = useState<any>(null)

  const loadAlertSettings = async () => {
    try {
      const data = await getAlertSettings()
      if (data.length > 0) setAlertSettings(data[0])
    } catch (error) {
      console.error('Failed to load alert settings', error)
    }
  }

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
    loadAlertSettings()
  }, [])

  useRealtime('clients', () => {
    loadClients()
  })

  useRealtime('configurations', () => {
    loadClients()
  })

  useRealtime('alert_settings', () => {
    loadAlertSettings()
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

  const activeClients = clients.filter((c) => {
    const statusName = c.expand?.status?.name?.toUpperCase() || ''
    return statusName !== 'BAIXA' && statusName !== 'CONCLUÍDO' && statusName !== 'CONCLUIDO'
  })

  let oldClientsCount = 0
  let criticalClientsCount = 0

  activeClients.forEach((c) => {
    if (!c.created) return
    const days = differenceInDays(new Date(), new Date(c.created))
    if (alertSettings) {
      if (days >= alertSettings.critical_days) {
        criticalClientsCount++
      } else if (days >= alertSettings.old_days) {
        oldClientsCount++
      }
    }
  })

  const moderateActive = alertSettings && oldClientsCount >= alertSettings.moderate_threshold
  const criticalActive = alertSettings && criticalClientsCount >= alertSettings.critical_threshold

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-slate-800 dark:text-slate-100">
            Clientes
          </h2>
          <p className="text-slate-500 text-sm">
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

      {alertSettings && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Ativos</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeClients.length}</div>
              <p className="text-xs text-muted-foreground">Clientes em andamento</p>
            </CardContent>
          </Card>
          <Card
            className={cn(
              'transition-colors',
              moderateActive && 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle
                className={cn(
                  'text-sm font-medium',
                  moderateActive && 'text-amber-600 dark:text-amber-500',
                )}
              >
                Alerta Moderado (Antigas)
              </CardTitle>
              <Clock
                className={cn(
                  'w-4 h-4',
                  moderateActive ? 'text-amber-600 dark:text-amber-500' : 'text-muted-foreground',
                )}
              />
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  'text-2xl font-bold',
                  moderateActive && 'text-amber-600 dark:text-amber-500',
                )}
              >
                {oldClientsCount}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  / {alertSettings.moderate_threshold}
                </span>
              </div>
              <p
                className={cn(
                  'text-xs',
                  moderateActive
                    ? 'text-amber-600/80 dark:text-amber-500/80 font-medium'
                    : 'text-muted-foreground',
                )}
              >
                {moderateActive ? 'Limite moderado atingido!' : 'Dentro do limite aceitável'}
              </p>
            </CardContent>
          </Card>
          <Card
            className={cn(
              'transition-colors',
              criticalActive && 'border-destructive bg-destructive/10 dark:bg-destructive/20',
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle
                className={cn(
                  'text-sm font-medium',
                  criticalActive && 'text-destructive dark:text-red-400',
                )}
              >
                Alerta Crítico
              </CardTitle>
              <AlertTriangle
                className={cn(
                  'w-4 h-4',
                  criticalActive ? 'text-destructive dark:text-red-400' : 'text-muted-foreground',
                )}
              />
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  'text-2xl font-bold',
                  criticalActive && 'text-destructive dark:text-red-400',
                )}
              >
                {criticalClientsCount}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  / {alertSettings.critical_threshold}
                </span>
              </div>
              <p
                className={cn(
                  'text-xs',
                  criticalActive
                    ? 'text-destructive/80 dark:text-red-400/80 font-medium'
                    : 'text-muted-foreground',
                )}
              >
                {criticalActive ? 'Limite crítico excedido!' : 'Dentro do limite aceitável'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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
        alertSettings={alertSettings}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBaixa={handleBaixa}
      />
    </div>
  )
}

export default Clientes
