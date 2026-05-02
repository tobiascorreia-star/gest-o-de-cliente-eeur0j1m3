import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useState } from 'react'
import { ConfigDataTable } from '@/components/configuracao/config-lists'
import { ErrorBoundary } from '@/components/error-boundary'

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
  const [error] = useState<string | null>(null)

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie regras de negócios e dados de listagem.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
            />
          </TabsContent>
          <TabsContent value="alertas" className="mt-4">
            <ConfigDataTable
              title="Alertas e Regras"
              description="Configure as regras de notificação e prazos do sistema."
              types={ALERT_TYPES}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  )
}

export default Configuracao
