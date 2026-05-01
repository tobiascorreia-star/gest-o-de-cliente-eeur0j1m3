import { useState } from 'react'
import { useApp } from '@/contexts/app-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

type ConfigListType = 'colaboradores' | 'solicitacoes' | 'statusList' | 'categorias' | 'pgtoTipos'

export function ConfigLists() {
  const {
    colaboradores,
    solicitacoes,
    statusList,
    categorias,
    pgtoTipos,
    addConfigItem,
    deleteConfigItem,
  } = useApp()
  const [newValues, setNewValues] = useState<Record<ConfigListType, string>>({
    colaboradores: '',
    solicitacoes: '',
    statusList: '',
    categorias: '',
    pgtoTipos: '',
  })

  const handleAdd = (type: ConfigListType) => {
    const val = newValues[type].trim()
    if (!val) return

    // Auto-generate some safe color classes for status and categories if needed
    const color =
      type === 'statusList'
        ? 'bg-blue-100 text-blue-800'
        : type === 'categorias'
          ? 'bg-purple-100 text-purple-800'
          : undefined

    addConfigItem(type, val, color)
    setNewValues((prev) => ({ ...prev, [type]: '' }))
    toast({ title: 'Sucesso', description: 'Item adicionado com sucesso.' })
  }

  const handleDelete = (type: ConfigListType, id: string) => {
    deleteConfigItem(type, id)
    toast({ title: 'Removido', description: 'O item foi removido.' })
  }

  const renderList = (title: string, type: ConfigListType, items: any[]) => (
    <Card className="border-border/50 shadow-sm rounded-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-5">
          <Input
            placeholder="Adicionar novo..."
            className="h-10 rounded-lg bg-muted/30"
            value={newValues[type]}
            onChange={(e) => setNewValues((prev) => ({ ...prev, [type]: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd(type)}
          />
          <Button
            size="icon"
            variant="secondary"
            className="shrink-0 h-10 w-10 rounded-lg"
            onClick={() => handleAdd(type)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted transition-colors text-sm group"
            >
              <div className="flex items-center gap-3">
                {item.color && (
                  <div
                    className={`w-3 h-3 rounded-full shadow-inner ${item.color.split(' ')[0]}`}
                  />
                )}
                <span className="font-medium text-foreground/80">{item.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(type, item.id)}
                className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum item cadastrado.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {renderList('Colaboradores', 'colaboradores', colaboradores)}
      {renderList('Solicitações', 'solicitacoes', solicitacoes)}
      {renderList('Status do Cliente', 'statusList', statusList)}
      {renderList('Categorias', 'categorias', categorias)}
      {renderList('Tipos de Pagamento', 'pgtoTipos', pgtoTipos)}
    </div>
  )
}
