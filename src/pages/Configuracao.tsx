import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState, useEffect } from 'react'
import { ConfigDataTable } from '@/components/configuracao/config-lists'
import { ErrorBoundary } from '@/components/error-boundary'
import {
  getConfigurations,
  createConfiguration,
  updateConfiguration,
  deleteConfiguration,
} from '@/services/configurations'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from '@/hooks/use-toast'

const LIST_TYPES = [
  { value: 'colaboradores', label: 'Colaboradores' },
  { value: 'solicitacoes', label: 'Solicitações' },
  { value: 'statusList', label: 'Status do Cliente' },
  { value: 'categorias', label: 'Categorias' },
  { value: 'pgtoTipos', label: 'Tipos de Pagamento' },
]

const ALERT_TYPES = [
  { value: 'alertRule', label: 'Regra de Alerta (SLA)' },
  { value: 'businessRule', label: 'Regra de Negócio' },
]

const Configuracao = () => {
  const [configurations, setConfigurations] = useState<any[]>([])

  const loadData = async () => {
    try {
      const data = await getConfigurations()
      setConfigurations(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('configurations', () => {
    loadData()
  })

  const handleUpdate = async (id: string, data: any) => {
    try {
      await updateConfiguration(id, data)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
      throw err
    }
  }

  const handleAdd = async (data: any) => {
    try {
      await createConfiguration(data)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
      throw err
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteConfiguration(id)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
      throw err
    }
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie regras de negócios e dados de listagem.
          </p>
        </div>

        <Tabs defaultValue="listas" className="mt-4">
          <TabsList className="bg-muted/50 border">
            <TabsTrigger value="listas">Dados Cadastrais</TabsTrigger>
            <TabsTrigger value="alertas">Área de Alerta</TabsTrigger>
          </TabsList>
          <TabsContent value="listas" className="mt-4">
            <ConfigDataTable
              title="Listas do Sistema"
              description="Gerencie as opções disponíveis nos formulários."
              types={LIST_TYPES}
              data={configurations}
              onAdd={handleAdd}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </TabsContent>
          <TabsContent value="alertas" className="mt-4">
            <ConfigDataTable
              title="Área de Alerta"
              description="Configure as regras de notificação e prazos do sistema."
              types={ALERT_TYPES}
              data={configurations}
              onAdd={handleAdd}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  )
}

export default Configuracao
