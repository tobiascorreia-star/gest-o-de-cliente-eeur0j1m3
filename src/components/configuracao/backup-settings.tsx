import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Database } from 'lucide-react'
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

  const handleExport = async () => {
    try {
      setLoading(true)
      const [clients, configurations] = await Promise.all([
        pb.collection('clients').getFullList(),
        pb.collection('configurations').getFullList(),
      ])

      const backupData = {
        timestamp: new Date().toISOString(),
        clients,
        configurations,
      }

      const dateStr = new Date().toISOString().split('T')[0]
      downloadJson(backupData, `backup_sistema_${dateStr}.json`)

      toast({ title: 'Sucesso', description: 'Backup gerado com sucesso.' })
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: `Falha ao gerar backup: ${err.message}`,
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
          Utilize esta função para baixar uma cópia de segurança de todos os clientes e
          configurações atuais em formato JSON.
        </p>

        <div className="max-w-md">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Backup Completo</h3>
                <p className="text-sm text-muted-foreground mt-1">Clientes e Configurações</p>
              </div>
              <Button className="w-full mt-2" disabled={loading} onClick={handleExport}>
                {loading ? 'Gerando...' : 'Gerar Backup de Dados'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
