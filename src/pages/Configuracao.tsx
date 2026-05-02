import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

const MOCK_CONFIGURATIONS = [
  {
    id: '1',
    type: 'colaboradores',
    name: 'Ana Silva',
    color: '',
    active: true,
    description: 'Analista Sênior',
  },
  {
    id: '2',
    type: 'colaboradores',
    name: 'Carlos Santos',
    color: '',
    active: true,
    description: 'Suporte',
  },
  {
    id: '3',
    type: 'solicitacoes',
    name: 'Renovação de Contrato',
    color: '',
    active: true,
    description: '',
  },
  {
    id: '4',
    type: 'statusList',
    name: 'Em Aberto',
    color: 'bg-blue-100 text-blue-800',
    active: true,
    description: '',
  },
  {
    id: '5',
    type: 'statusList',
    name: 'Em Análise',
    color: 'bg-yellow-100 text-yellow-800',
    active: true,
    description: '',
  },
  {
    id: '6',
    type: 'statusList',
    name: 'Baixa',
    color: 'bg-green-100 text-green-800',
    active: true,
    description: '',
  },
  {
    id: '7',
    type: 'categorias',
    name: 'VIP',
    color: 'bg-purple-100 text-purple-800',
    active: true,
    description: '',
  },
  {
    id: '8',
    type: 'categorias',
    name: 'Regular',
    color: 'bg-gray-100 text-gray-800',
    active: true,
    description: '',
  },
  { id: '9', type: 'pgtoTipos', name: 'Pix', color: '', active: true, description: '' },
  {
    id: '10',
    type: 'pgtoTipos',
    name: 'Cartão de Crédito',
    color: '',
    active: true,
    description: '',
  },
]

const Configuracao = () => {
  const [configurations, setConfigurations] = useState<any[]>(MOCK_CONFIGURATIONS)

  const handleUpdate = (id: string, data: any) => {
    setConfigurations((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
  }

  const handleAdd = (data: any) => {
    setConfigurations((prev) => [{ id: Date.now().toString(), ...data }, ...prev])
  }

  const handleDelete = (id: string) => {
    setConfigurations((prev) => prev.filter((c) => c.id !== id))
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
            <TabsTrigger value="alertas">Alertas e Regras</TabsTrigger>
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
              title="Alertas e Regras"
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
