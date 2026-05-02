import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type ConfigListType = 'colaboradores' | 'solicitacoes' | 'statusList' | 'categorias' | 'pgtoTipos'

const COLORS = [
  { label: 'Cinza', class: 'bg-gray-100 text-gray-800' },
  { label: 'Azul', class: 'bg-blue-100 text-blue-800' },
  { label: 'Verde', class: 'bg-green-100 text-green-800' },
  { label: 'Amarelo', class: 'bg-yellow-100 text-yellow-800' },
  { label: 'Vermelho', class: 'bg-red-100 text-red-800' },
  { label: 'Roxo', class: 'bg-purple-100 text-purple-800' },
  { label: 'Teal', class: 'bg-teal-100 text-teal-800' },
]

export function ConfigLists() {
  const [configurations, setConfigurations] = useState<any[]>([])
  const [newValues, setNewValues] = useState<Record<ConfigListType, string>>({
    colaboradores: '',
    solicitacoes: '',
    statusList: '',
    categorias: '',
    pgtoTipos: '',
  })

  const [newColors, setNewColors] = useState<Record<ConfigListType, string>>({
    colaboradores: '',
    solicitacoes: '',
    statusList: 'bg-blue-100 text-blue-800',
    categorias: 'bg-purple-100 text-purple-800',
    pgtoTipos: '',
  })

  const fetchConfigs = async () => {
    try {
      const records = await pb.collection('configurations').getFullList({ sort: '-created' })
      setConfigurations(records)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  const getItemsByType = (type: string) => configurations.filter((c) => c.type === type)

  const handleAdd = async (type: ConfigListType) => {
    const val = newValues[type].trim()
    if (!val) return

    const color = newColors[type]

    try {
      await pb.collection('configurations').create({
        type,
        name: val,
        color: color || '',
      })

      setNewValues((prev) => ({ ...prev, [type]: '' }))
      toast({ title: 'Sucesso', description: 'Item adicionado com sucesso.' })
      fetchConfigs()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao adicionar item.', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await pb.collection('configurations').delete(id)
      toast({ title: 'Removido', description: 'O item foi removido.' })
      fetchConfigs()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao remover item.', variant: 'destructive' })
    }
  }

  const renderList = (title: string, type: ConfigListType, hasColorPicker = false) => {
    const items = getItemsByType(type)

    return (
      <Card className="border-border/50 shadow-sm rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-5">
            <Input
              placeholder="Adicionar novo..."
              className="h-10 rounded-lg bg-muted/30 flex-1"
              value={newValues[type]}
              onChange={(e) => setNewValues((prev) => ({ ...prev, [type]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd(type)}
            />
            {hasColorPicker && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 w-10 p-0 rounded-lg shrink-0 overflow-hidden"
                  >
                    <div
                      className={`w-full h-full ${newColors[type].split(' ')[0] || 'bg-gray-200'}`}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2">
                  <div className="grid grid-cols-4 gap-2">
                    {COLORS.map((c) => (
                      <div
                        key={c.class}
                        title={c.label}
                        onClick={() => setNewColors((prev) => ({ ...prev, [type]: c.class }))}
                        className={`w-8 h-8 rounded-full cursor-pointer border-2 hover:scale-110 transition-transform ${c.class.split(' ')[0]} ${
                          newColors[type] === c.class ? 'border-primary' : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
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
                  onClick={() => handleDelete(item.id)}
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
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {renderList('Colaboradores', 'colaboradores')}
      {renderList('Solicitações', 'solicitacoes')}
      {renderList('Status do Cliente', 'statusList', true)}
      {renderList('Categorias', 'categorias', true)}
      {renderList('Tipos de Pagamento', 'pgtoTipos')}
    </div>
  )
}
