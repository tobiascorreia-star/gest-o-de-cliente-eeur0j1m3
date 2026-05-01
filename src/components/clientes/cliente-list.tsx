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
  isRestrictedArea?: boolean
}

export function ClienteList({
  clients,
  onEdit,
  onDelete,
  onBaixa,
  onReverse,
  isRestrictedArea = false,
}: ClienteListProps) {
  const {
    currentUser,
    colaboradores,
    solicitacoes,
    statusList,
    categorias,
    pgtoTipos,
    alertConfig,
  } = useApp()
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

  const isOperator = currentUser?.role === 'Operator'

  const renderActions = (client: Client) => {
    if (isOperator && isRestrictedArea) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => {}}>
              <FileText className="mr-2 h-4 w-4" /> Gerar Relatório
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onEdit(client)}>
            <Edit className="mr-2 h-4 w-4" /> Editar Cliente
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {}}>
            <FileText className="mr-2 h-4 w-4" /> Gerar Relatório
          </DropdownMenuItem>

          {client.statusId !== baixaStatusId && (
            <DropdownMenuItem
              onClick={() => onBaixa(client.id)}
              className="text-emerald-600 focus:text-emerald-600"
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Realizar Baixa
            </DropdownMenuItem>
          )}

          {client.statusId === baixaStatusId && onReverse && !isOperator && (
            <DropdownMenuItem
              onClick={() => onReverse(client.id)}
              className="text-orange-600 focus:text-orange-600"
            >
              <Undo2 className="mr-2 h-4 w-4" /> Estornar Baixa
            </DropdownMenuItem>
          )}

          {!isOperator && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(client.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Excluir Registro
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 border-b-border/50">
              <TableHead className="font-semibold">CNPJ / Razão Social</TableHead>
              <TableHead className="font-semibold">Cliente</TableHead>
              <TableHead className="font-semibold">Colaborador</TableHead>
              <TableHead className="font-semibold">Solicitação</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Pgto</TableHead>
              <TableHead className="font-semibold max-w-[200px]">Obs</TableHead>
              <TableHead className="font-semibold">Data</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="h-8 w-8 mb-2 opacity-20" />
                    Nenhum cliente encontrado.
                  </div>
                </TableCell>
              </TableRow>
            )}
            {clients.map((client) => (
              <TableRow
                key={client.id}
                className={`group transition-colors hover:bg-muted/30 ${getAlertColor(client)}`}
              >
                <TableCell>
                  <div className="font-medium text-foreground">{client.razaoSocial}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    {client.cnpj}
                  </div>
                  <Badge
                    variant="outline"
                    className={`mt-1.5 text-[10px] border-none ${getLookupColor(categorias, client.categoriaId)}`}
                  >
                    {getLookupName(categorias, client.categoriaId)}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-sm">{client.nome}</TableCell>
                <TableCell className="text-sm">
                  {getLookupName(colaboradores, client.colaboradorId)}
                </TableCell>
                <TableCell className="text-sm">
                  {getLookupName(solicitacoes, client.solicitacaoId)}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-medium ${getLookupColor(statusList, client.statusId)}`}
                  >
                    {getLookupName(statusList, client.statusId)}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{getLookupName(pgtoTipos, client.pgtoId)}</TableCell>
                <TableCell
                  className="text-xs text-muted-foreground max-w-[200px] truncate"
                  title={client.obs}
                >
                  {client.obs || '-'}
                </TableCell>
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
          <div className="text-center py-12 text-muted-foreground bg-card border rounded-xl shadow-sm">
            Nenhum cliente encontrado.
          </div>
        )}
        {clients.map((client) => (
          <Card
            key={client.id}
            className={`overflow-hidden rounded-xl shadow-sm ${getAlertColor(client)}`}
          >
            <CardContent className="p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-foreground">{client.razaoSocial}</h4>
                  <p className="text-xs font-mono text-muted-foreground mt-1">{client.cnpj}</p>
                  <p className="text-sm font-medium mt-2">Cliente: {client.nome}</p>
                </div>
                {renderActions(client)}
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${getLookupColor(statusList, client.statusId)}`}
                >
                  {getLookupName(statusList, client.statusId)}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] border-none ${getLookupColor(categorias, client.categoriaId)}`}
                >
                  {getLookupName(categorias, client.categoriaId)}
                </Badge>
              </div>
              {client.obs && (
                <div className="text-xs bg-muted/50 p-2 rounded-md text-muted-foreground italic">
                  "{client.obs}"
                </div>
              )}
              <div className="text-sm grid grid-cols-3 gap-2 mt-2 bg-muted/30 p-3 rounded-lg">
                <div className="col-span-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                    Resp.
                  </span>
                  <span className="truncate block font-medium">
                    {getLookupName(colaboradores, client.colaboradorId)}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                    Pgto
                  </span>
                  <span className="truncate block font-medium">
                    {getLookupName(pgtoTipos, client.pgtoId)}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                    Data
                  </span>
                  <span className="truncate block font-medium">
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
