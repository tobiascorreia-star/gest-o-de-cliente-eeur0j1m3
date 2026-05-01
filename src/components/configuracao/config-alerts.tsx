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
  const [old, setOld] = useState(alertConfig.oldDays?.toString() || '30')
  const [veryCritical, setVeryCritical] = useState(alertConfig.veryCriticalDays?.toString() || '45')

  const handleSave = () => {
    setAlertConfig({
      moderateDays: parseInt(moderate, 10),
      criticalDays: parseInt(critical, 10),
      oldDays: parseInt(old, 10),
      veryCriticalDays: parseInt(veryCritical, 10),
    })
    toast({
      title: 'Configurações Salvas',
      description: 'As regras de alerta foram atualizadas globalmente.',
    })
  }

  return (
    <Card className="max-w-3xl border-border/50 shadow-sm rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl">Limites de Alerta e Antiguidade</CardTitle>
        <CardDescription>
          Defina o tempo de vida (em dias) das solicitações para acionar os indicadores visuais no
          painel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <div className="w-3 h-3 rounded-full bg-amber-500 shadow-inner" />
              Alerta Moderado (Dias)
            </Label>
            <Input
              type="number"
              value={moderate}
              onChange={(e) => setModerate(e.target.value)}
              className="border-amber-200 focus-visible:ring-amber-500 rounded-lg"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Destaca registros pendentes acima deste prazo (Yellow).
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <div className="w-3 h-3 rounded-full bg-destructive shadow-inner" />
              Alerta Crítico (Dias)
            </Label>
            <Input
              type="number"
              value={critical}
              onChange={(e) => setCritical(e.target.value)}
              className="border-red-200 focus-visible:ring-destructive rounded-lg"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Marca registros como críticos e notifica na barra superior (Red).
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <div className="w-3 h-3 rounded-full bg-slate-400 shadow-inner" />
              Antiguidade (Dias)
            </Label>
            <Input
              type="number"
              value={old}
              onChange={(e) => setOld(e.target.value)}
              className="rounded-lg bg-muted/30"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Define a partir de quantos dias o registro é considerado 'Antigo'.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <div className="w-3 h-3 rounded-full bg-purple-600 shadow-inner" />
              Crítica Absoluta (Dias)
            </Label>
            <Input
              type="number"
              value={veryCritical}
              onChange={(e) => setVeryCritical(e.target.value)}
              className="rounded-lg bg-muted/30"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Limite final de urgência sistêmica para escalonamento.
            </p>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full sm:w-auto rounded-lg px-8">
          Salvar Regras
        </Button>
      </CardContent>
    </Card>
  )
}
