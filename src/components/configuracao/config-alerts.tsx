import { useState } from 'react'
import { useApp } from '@/contexts/app-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'

export function ConfigAlerts() {
  const { alertConfig, setAlertConfig } = useApp()
  const [moderate, setModerate] = useState(alertConfig.moderateDays.toString())
  const [critical, setCritical] = useState(alertConfig.criticalDays.toString())

  const handleSave = () => {
    setAlertConfig({
      moderateDays: parseInt(moderate, 10),
      criticalDays: parseInt(critical, 10),
    })
    toast({
      title: 'Configurações Salvas',
      description: 'As regras de alerta foram atualizadas globalmente.',
    })
  }

  return (
    <Card className="max-w-2xl border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Regras de Alerta</CardTitle>
        <CardDescription>
          Defina o tempo de vida (em dias) das solicitações para acionar indicadores visuais.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              Alerta Moderado (Dias)
            </Label>
            <Input
              type="number"
              value={moderate}
              onChange={(e) => setModerate(e.target.value)}
              className="border-amber-200 focus-visible:ring-amber-500"
            />
            <p className="text-xs text-muted-foreground">
              Destaca registros pendentes acima deste prazo.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              Alerta Crítico (Dias)
            </Label>
            <Input
              type="number"
              value={critical}
              onChange={(e) => setCritical(e.target.value)}
              className="border-red-200 focus-visible:ring-destructive"
            />
            <p className="text-xs text-muted-foreground">
              Marca registros como críticos e notifica na barra superior.
            </p>
          </div>
        </div>

        <Button onClick={handleSave}>Salvar Alterações</Button>
      </CardContent>
    </Card>
  )
}
