import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Edit2, Search } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { logAudit } from '@/services/audit'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const COLORS = [
  { class: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Cinza' },
  { class: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Azul' },
  { class: 'bg-green-100 text-green-800 border-green-200', label: 'Verde' },
  { class: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Amarelo' },
  { class: 'bg-red-100 text-red-800 border-red-200', label: 'Vermelho' },
  { class: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Roxo' },
  { class: 'bg-teal-100 text-teal-800 border-teal-200', label: 'Teal' },
]

interface ConfigDataTableProps {
  title: string
  description: string
  types: { value: string; label: string }[]
  data: any[]
  onAdd: (data: any) => Promise<void> | void
  onUpdate: (id: string, data: any) => Promise<void> | void
  onDelete: (id: string) => Promise<void> | void
}

export function ConfigDataTable({
  title,
  description,
  types,
  data,
  onAdd,
  onUpdate,
  onDelete,
}: ConfigDataTableProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    color: '',
    description: '',
    active: true,
    days: '' as string | number,
  })

  const filteredConfigs = useMemo(() => {
    const typeValues = types.map((t) => t.value)
    return data.filter((c) => {
      if (!c || !c.type || !typeValues.includes(c.type)) return false
      const nameStr = c.name || ''
      const descStr = c.description || ''
      const searchStr = search.toLowerCase()
      const matchesSearch =
        nameStr.toLowerCase().includes(searchStr) || descStr.toLowerCase().includes(searchStr)
      const matchesType = typeFilter === 'all' || c.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [data, search, typeFilter, types])

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData({
      name: '',
      type: types[0]?.value || '',
      color: '',
      description: '',
      active: true,
      days: '',
    })
    setOpen(true)
  }

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id)
    setFormData({
      name: item.name,
      type: item.type,
      color: item.color || '',
      description: item.description || '',
      active: item.active !== false,
      days: item.days ?? '',
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.type) {
      toast({
        title: 'Atenção',
        description: 'Nome e Tipo são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const dataToSave = {
        ...formData,
        days: formData.days === '' ? null : Number(formData.days),
      }

      if (editingId) {
        await onUpdate(editingId, dataToSave)
        try {
          logAudit('UPDATE_CONFIG', `Atualizada configuração: ${formData.name}`)
        } catch {
          /* intentionally ignored */
        }
        toast({ title: 'Sucesso', description: 'Configuração atualizada com sucesso.' })
      } else {
        await onAdd(dataToSave)
        try {
          logAudit('CREATE_CONFIG', `Criada configuração: ${formData.name}`)
        } catch {
          /* intentionally ignored */
        }
        toast({ title: 'Sucesso', description: 'Configuração criada com sucesso.' })
      }
      setOpen(false)
    } catch (err) {
      // Errors handled by parent component catching and toasting
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = async (id: string, name: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta configuração?')) return
    try {
      await onDelete(id)
      try {
        logAudit('DELETE_CONFIG', `Removida configuração: ${name}`)
      } catch {
        /* intentionally ignored */
      }
      toast({ title: 'Sucesso', description: 'Configuração removida.' })
    } catch (err) {
      // Errors handled by parent
    }
  }

  const toggleStatus = async (item: any) => {
    try {
      await onUpdate(item.id, { active: !item.active })
      try {
        logAudit(
          'TOGGLE_CONFIG_STATUS',
          `Status da configuração ${item.name} alterado para ${!item.active ? 'Ativo' : 'Inativo'}`,
        )
      } catch {
        /* intentionally ignored */
      }
    } catch (err) {
      // Errors handled by parent
    }
  }

  const getTypeLabel = (typeVal: string) => types.find((t) => t.value === typeVal)?.label || typeVal

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" /> Nova Configuração
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-muted/30"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[220px] bg-muted/30">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {types.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Descrição</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead className="w-[80px] text-right">Dias</TableHead>
                <TableHead className="w-[80px] text-center">Ativo</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConfigs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center py-4 space-y-3">
                      <p className="text-muted-foreground">Nenhuma configuração encontrada.</p>
                      <Button onClick={handleOpenCreate} variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Primeira Opção
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredConfigs.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name || 'Sem nome'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {getTypeLabel(item.type)}
                      </Badge>
                    </TableCell>{' '}
                    <TableCell className="text-muted-foreground hidden md:table-cell truncate max-w-[200px]">
                      {item.description || '-'}
                    </TableCell>
                    <TableCell>
                      {item.color ? (
                        <Badge variant="outline" className={cn('font-normal border', item.color)}>
                          {COLORS.find((c) => c.class === item.color)?.label || 'Cor'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.days !== null && item.days !== undefined && item.days !== '' ? (
                        item.days
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={item.active !== false}
                        onCheckedChange={() => toggleStatus(item)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(item)}
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(item.id, item.name)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Configuração' : 'Nova Configuração'}</DialogTitle>
            <DialogDescription>Preencha os detalhes para esta opção do sistema.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Tipo da Lista
              </Label>
              <Select
                value={formData.type}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, type: val }))}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Nome
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Alta Prioridade"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="days">Dias (Duração / Prazo)</Label>
              <Input
                id="days"
                type="number"
                min="0"
                value={formData.days}
                onChange={(e) => setFormData((prev) => ({ ...prev, days: e.target.value }))}
                placeholder="Ex: 7"
              />
            </div>
            <div className="grid gap-2">
              <Label>Cor de Destaque</Label>
              <div className="flex flex-wrap gap-3 mt-1">
                {COLORS.map((c) => (
                  <button
                    key={c.class}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        color: prev.color === c.class ? '' : c.class,
                      }))
                    }
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all hover:scale-110',
                      c.class.split(' ')[0],
                      formData.color === c.class
                        ? 'border-primary scale-110 ring-2 ring-primary/20 ring-offset-1'
                        : 'border-transparent',
                    )}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Opcional. Informação adicional..."
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t mt-2">
              <Label htmlFor="active" className="flex flex-col gap-1 cursor-pointer">
                <span className="font-medium">Status Ativo</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Habilita esta opção para uso no sistema.
                </span>
              </Label>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(val) => setFormData((prev) => ({ ...prev, active: val }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
