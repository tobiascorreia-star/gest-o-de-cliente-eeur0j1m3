import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigLists } from '@/components/configuracao/config-lists'
import { ConfigAlerts } from '@/components/configuracao/config-alerts'

const Configuracao = () => {
  return (
    <div className="space-y-4">
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
          <ConfigLists />
        </TabsContent>
        <TabsContent value="alertas" className="mt-4">
          <ConfigAlerts />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Configuracao
