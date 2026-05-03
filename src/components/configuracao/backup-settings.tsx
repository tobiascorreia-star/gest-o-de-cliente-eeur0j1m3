import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Database, Settings, BellRing } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export function BackupSettingsForm() {
  const [loading, setLoading] = useState(false)

  const downloadJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExport = async (collection: string, name: string) => {
    try {
      setLoading(true)
      const records = await pb.collection(collection).getFullList()
      downloadJson(records, `backup_${name}_${new Date().toISOString().split('T')[0]}.json`)
      toast({ title: 'Sucesso', description: `Backup de ${name} concluído com sucesso.` })
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: `Falha ao exportar ${name}: ${err.message}`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-none shadow-none bg-[#f8fafc] rounded-md">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-bold text-green-600">Backup do Sistema</h2>
        </div>
        <p className="text-muted-foreground text-sm mb-8">
          Exporte os dados das principais coleções do sistema.
        </p>

        <div className="grid gap-4 md:grid-cols-3 max-w-4xl">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Clientes</h3>
                <p className="text-sm text-muted-foreground mt-1">Base completa de clientes</p>
              </div>
              <Button
                variant="outline"
                className="w-full mt-2"
                disabled={loading}
                onClick={() => handleExport('clients', 'clientes')}
              >
                <Download className="w-4 h-4 mr-2" /> Exportar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Configurações</h3>
                <p className="text-sm text-muted-foreground mt-1">Listas de referência</p>
              </div>
              <Button
                variant="outline"
                className="w-full mt-2"
                disabled={loading}
                onClick={() => handleExport('configurations', 'configuracoes')}
              >
                <Download className="w-4 h-4 mr-2" /> Exportar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <BellRing className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Alertas</h3>
                <p className="text-sm text-muted-foreground mt-1">Regras de pendências</p>
              </div>
              <Button
                variant="outline"
                className="w-full mt-2"
                disabled={loading}
                onClick={() => handleExport('alert_settings', 'alertas')}
              >
                <Download className="w-4 h-4 mr-2" /> Exportar
              </Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
