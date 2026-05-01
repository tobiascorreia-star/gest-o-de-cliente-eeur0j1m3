import { useApp } from '@/contexts/app-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

export function ConfigLists() {
  const { colaboradores, solicitacoes, statusList, categorias } = useApp()

  const renderList = (title: string, items: any[]) => (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input placeholder="Adicionar novo..." className="h-9" />
          <Button size="sm" variant="secondary" className="shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
            >
              <div className="flex items-center gap-2">
                {item.color && (
                  <div className={`w-3 h-3 rounded-full ${item.color.split(' ')[0]}`} />
                )}
                <span>{item.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {renderList('Colaboradores', colaboradores)}
      {renderList('Solicitações', solicitacoes)}
      {renderList('Status', statusList)}
      {renderList('Categorias', categorias)}
    </div>
  )
}
