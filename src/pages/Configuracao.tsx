import { useState, useEffect } from 'react'
import { getConfigurations } from '@/services/configurations'
import { ConfigDataTable } from '@/components/configuracao/config-lists'
import { AlertSettingsForm } from '@/components/configuracao/alert-settings-form'
import { BackupSettingsForm } from '@/components/configuracao/backup-settings'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const CONFIG_TYPES = [
  { value: 'Status', label: 'Status' },
  { value: 'Categoria', label: 'Categorias' },
  { value: 'Solicitação', label: 'Solicitações' },
  { value: 'Colaborador', label: 'Colaboradores' },
  { value: 'Pgto', label: 'Pagamentos' },
]

export default function Configuracao() {
  const [configs, setConfigs] = useState<any[]>([])
  const { toast } = useToast()

  const loadConfigs = async () => {
    try {
      const data = await getConfigurations()
      setConfigs(data)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar configurações.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadConfigs()
  }, [])

  // Automatically update the config UI in real-time
  useRealtime('configurations', loadConfigs)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h2>
        <p className="text-muted-foreground text-sm">
          Gerencie as listas de seleção usadas nos formulários.
        </p>
      </div>

      <Tabs defaultValue="listas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="listas">Listas</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="listas">
          <ConfigDataTable
            title="Listas do Sistema"
            description="Gerencie Status, Categorias, Solicitações, Colaboradores e Tipos de Pagamento."
            types={CONFIG_TYPES}
            data={configs}
            onAdd={async (data) => {
              await pb.collection('configurations').create(data)
            }}
            onUpdate={async (id, data) => {
              await pb.collection('configurations').update(id, data)
            }}
            onDelete={async (id) => {
              await pb.collection('configurations').delete(id)
            }}
          />
        </TabsContent>

        <TabsContent value="alertas">
          <AlertSettingsForm />
        </TabsContent>

        <TabsContent value="backup">
          <BackupSettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
