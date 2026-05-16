import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { getAlertSettings, updateAlertSettings } from '@/services/alert_settings'
import { Card, CardContent } from '@/components/ui/card'

export function AlertSettingsForm() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    try {
      const data = await getAlertSettings()
      if (data && data.length > 0) {
        setSettings(data[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSave = async () => {
    if (!settings?.id) return
    setSaving(true)
    try {
      await updateAlertSettings(settings.id, {
        old_days: Number(settings.old_days),
        critical_days: Number(settings.critical_days),
        old_admin_days: Number(settings.old_admin_days),
      })
      toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso.' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-none shadow-none bg-slate-50 dark:bg-slate-900/50 rounded-md animate-pulse">
        <CardContent className="p-6 space-y-4">
          <div className="h-6 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-4 w-2/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="space-y-3 mt-6">
            <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-none bg-[#f8fafc] dark:bg-slate-900/50 rounded-md">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🔔</span>
          <h2 className="text-xl font-bold text-green-600">Alertas de Pendências</h2>
        </div>
        <p className="text-muted-foreground text-sm mb-8">
          Defina as regras de dias e virada de mês para alertas no dashboard.
        </p>

        <div className="space-y-4 max-w-4xl">
          <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-200">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                Alerta Moderado (old_days)
              </label>
              <span className="text-xs text-muted-foreground ml-7">
                Se cliente com status Aguardando.
              </span>
            </div>
            <Input
              type="number"
              className="w-24 text-center font-bold text-green-600 bg-white focus-visible:ring-green-500"
              value={settings?.old_days || 0}
              onChange={(e) => setSettings({ ...settings, old_days: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-200">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="text-lg">🚨</span>
                Alerta Crítico (critical_days)
              </label>
              <span className="text-xs text-muted-foreground ml-7">
                Se cliente com status Aguardando ou Atenção.
              </span>
            </div>
            <Input
              type="number"
              className="w-24 text-center font-bold text-green-600 bg-white focus-visible:ring-green-500"
              value={settings?.critical_days || 0}
              onChange={(e) => setSettings({ ...settings, critical_days: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-200">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="text-lg">⏱️</span>
                Destacar como antiga (old_admin_days)
              </label>
              <span className="text-xs text-muted-foreground ml-7">
                Apenas para Administradores — Pgto Aberto.
              </span>
            </div>
            <Input
              type="number"
              className="w-24 text-center font-bold text-green-600 bg-white focus-visible:ring-green-500"
              value={settings?.old_admin_days || 0}
              onChange={(e) => setSettings({ ...settings, old_admin_days: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-200">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="text-lg">🔴</span>
                Destacar como crítica (Regra 04)
              </label>
              <span className="text-xs text-muted-foreground ml-7">
                Aplica alerta Crítico (para status "Aguardando" ou "Atenção").
              </span>
            </div>
            <div className="w-24 flex justify-center">
              <span className="bg-slate-100 text-slate-500 font-bold py-1 px-3 rounded-md border text-sm">
                Mês
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-500 hover:bg-green-600 text-white gap-2 font-semibold"
          >
            <span className="text-lg">💾</span>
            Salvar Alterações
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
