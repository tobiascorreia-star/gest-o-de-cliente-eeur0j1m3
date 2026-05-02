import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useState } from 'react'

const Configuracao = () => {
  const [error] = useState<string | null>(null)

  return (
    <div className="space-y-4">
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
          <Card>
            <CardHeader>
              <CardTitle>Listas do Sistema</CardTitle>
              <CardDescription>Gerencie as opções disponíveis nos formulários.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Módulo de dados cadastrais em desenvolvimento.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="alertas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas</CardTitle>
              <CardDescription>Configure as regras de notificação.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Módulo de alertas em desenvolvimento.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Configuracao
