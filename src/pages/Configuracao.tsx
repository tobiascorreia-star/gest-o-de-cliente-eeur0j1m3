import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useState, useEffect } from 'react'
import { ConfigDataTable } from '@/components/configuracao/config-lists'
import { ErrorBoundary } from '@/components/error-boundary'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'

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
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [configurations, setConfigurations] = useState<any[]>([])

  const fetchConfigs = async () => {
    try {
      setLoading(true)
      setError(null)
      const records = await pb.collection('configurations').getFullList({ sort: '-created' })
      setConfigurations(records || [])
    } catch (err: any) {
      if (!err.isAbort) {
        setError('Falha ao carregar configurações.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  useRealtime('configurations', () => {
    fetchConfigs()
  })

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie regras de negócios e dados de listagem.
          </p>
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-muted/20 mt-4">
            <AlertCircle className="w-8 h-8 text-destructive mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchConfigs()} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-12 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="listas" className="mt-4">
            <TabsList className="bg-muted/50 border">
              <TabsTrigger value="listas">Dados Cadastrais</TabsTrigger>
              <TabsTrigger value="alertas">Alertas e Regras</TabsTrigger>
            </TabsList>
            <TabsContent value="listas" className="mt-4">
              <ConfigDataTable
                title="Listas do Sistema"
                description="Gerencie as opções disponíveis nos formulários."
                types={LIST_TYPES}
                data={configurations}
                onRefresh={fetchConfigs}
              />
            </TabsContent>
            <TabsContent value="alertas" className="mt-4">
              <ConfigDataTable
                title="Alertas e Regras"
                description="Configure as regras de notificação e prazos do sistema."
                types={ALERT_TYPES}
                data={configurations}
                onRefresh={fetchConfigs}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default Configuracao
