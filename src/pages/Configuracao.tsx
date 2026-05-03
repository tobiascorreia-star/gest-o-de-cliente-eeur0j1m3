import { useState, useEffect } from 'react'
import { ConfigDataTable } from '@/components/configuracao/config-lists'
import { AlertSettingsForm } from '@/components/configuracao/alert-settings-form'
import { BackupSettingsForm } from '@/components/configuracao/backup-settings'
import { ErrorBoundary } from '@/components/error-boundary'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getConfigurations,
  createConfiguration,
  updateConfiguration,
  deleteConfiguration,
} from '@/services/configurations'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from '@/hooks/use-toast'

const CONFIG_TYPES = [
  { value: 'Colaborador', label: 'Colaborador' },
  { value: 'Solicitação', label: 'Solicitação' },
  { value: 'Status', label: 'Status' },
  { value: 'Categoria', label: 'Categoria' },
  { value: 'Pgto', label: 'Pgto' },
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

        <Tabs defaultValue="listas" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="listas">Listas de Referência</TabsTrigger>
            <TabsTrigger value="alertas">Alertas de Pendências</TabsTrigger>
            <TabsTrigger value="backup">Backup do Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="listas" className="mt-0">
            <ConfigDataTable
              title="Listas do Sistema"
              description="Gerencie as opções disponíveis nos formulários."
              types={CONFIG_TYPES}
              data={configurations}
              onAdd={handleAdd}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="alertas" className="mt-0">
            <AlertSettingsForm />
          </TabsContent>

          <TabsContent value="backup" className="mt-0">
            <BackupSettingsForm />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  )
}

export default Configuracao
