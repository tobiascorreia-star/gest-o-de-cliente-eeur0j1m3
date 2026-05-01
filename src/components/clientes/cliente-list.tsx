import { Client } from '@/types'
import { useApp } from '@/contexts/app-context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, FileText, Trash2, Edit, CheckCircle, Undo2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format, differenceInDays } from 'date-fns'

interface ClienteListProps {
  clients: Client[]
  onEdit: (client: Client) => void
  onDelete: (id: string) => void
  onBaixa: (id: string) => void
  onReverse?: (id: string) => void
}

export function ClienteList({ clients, onEdit, onDelete, onBaixa, onReverse }: ClienteListProps) {
  const { colaboradores, solicitacoes, statusList, categorias, pgtoTipos, alertConfig } = useApp()
  const baixaStatusId = statusList.find((s) => s.name === 'Baixa')?.id

  const getLookupName = (list: any[], id: string) =>
    list.find((item) => item.id === id)?.name || '-'
  const getLookupColor = (list: any[], id: string) =>
    list.find((item) => item.id === id)?.color || 'bg-gray-100 text-gray-800'

  const getAlertColor = (client: Client) => {
    if (client.statusId === baixaStatusId) return ''
    const days = differenceInDays(new Date(), new Date(client.dataCadastro))
    if (days >= alertConfig.criticalDays) return 'border-l-4 border-l-destructive bg-destructive/5'
    if (days >= alertConfig.moderateDays) return 'border-l-4 border-l-amber-500 bg-amber-500/5'
    return ''
  }

  const renderActions = (client: Client) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(client)}>
          <Edit className="mr-2 h-4 w-4" /> Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {}}>
          <FileText className="mr-2 h-4 w-4" /> Gerar Relatório
        </DropdownMenuItem>

        {client.statusId !== baixaStatusId && (
          <DropdownMenuItem onClick={() => onBaixa(client.id)} className="text-emerald-600">
            <CheckCircle className="mr-2 h-4 w-4" /> Dar Baixa
          </DropdownMenuItem>
        )}

        {client.statusId === baixaStatusId && onReverse && (
          <DropdownMenuItem onClick={() => onReverse(client.id)} className="text-orange-600">
            <Undo2 className="mr-2 h-4 w-4" /> Estornar
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(client.id)} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" /> Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <>
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>CNPJ / Razão Social</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Colaborador</TableHead>
              <TableHead>Solicitação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pgto</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
            {clients.map((client) => (
              <TableRow
                key={client.id}
                className={`group transition-colors ${getAlertColor(client)}`}
              >
                <TableCell>
                  <div className="font-medium">{client.razaoSocial}</div>
                  <div className="text-xs text-muted-foreground">{client.cnpj}</div>
                  <Badge
                    variant="outline"
                    className={`mt-1 text-[10px] ${getLookupColor(categorias, client.categoriaId)}`}
                  >
                    {getLookupName(categorias, client.categoriaId)}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-sm">{client.nome}</TableCell>
                <TableCell>{getLookupName(colaboradores, client.colaboradorId)}</TableCell>
                <TableCell>{getLookupName(solicitacoes, client.solicitacaoId)}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getLookupColor(statusList, client.statusId)}`}
                  >
                    {getLookupName(statusList, client.statusId)}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{getLookupName(pgtoTipos, client.pgtoId)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(client.dataCadastro), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>{renderActions(client)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {clients.length === 0 && (
          <div className="text-center py-8 text-muted-foreground bg-card border rounded-md">
            Nenhum cliente encontrado.
          </div>
        )}
        {clients.map((client) => (
          <Card key={client.id} className={`overflow-hidden ${getAlertColor(client)}`}>
            <CardContent className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium leading-none">{client.razaoSocial}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{client.cnpj}</p>
                  <p className="text-sm font-medium mt-1">Cliente: {client.nome}</p>
                </div>
                {renderActions(client)}
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getLookupColor(statusList, client.statusId)}`}
                >
                  {getLookupName(statusList, client.statusId)}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${getLookupColor(categorias, client.categoriaId)}`}
                >
                  {getLookupName(categorias, client.categoriaId)}
                </Badge>
              </div>
              <div className="text-sm grid grid-cols-3 gap-2 mt-2 bg-muted/30 p-2 rounded-md">
                <div className="col-span-1">
                  <span className="text-xs text-muted-foreground block">Colaborador</span>
                  <span className="truncate block">
                    {getLookupName(colaboradores, client.colaboradorId)}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className="text-xs text-muted-foreground block">Pgto</span>
                  <span className="truncate block">{getLookupName(pgtoTipos, client.pgtoId)}</span>
                </div>
                <div className="col-span-1">
                  <span className="text-xs text-muted-foreground block">Data</span>
                  <span className="truncate block">
                    {format(new Date(client.dataCadastro), 'dd/MM/yy')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
