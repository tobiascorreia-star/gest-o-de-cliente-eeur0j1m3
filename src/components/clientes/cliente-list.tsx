import { useState } from 'react'
import { Client } from '@/types'
import { useAuth } from '@/hooks/use-auth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MoreHorizontal,
  FileText,
  Trash2,
  Edit,
  CheckCircle,
  Undo2,
  Copy,
  Check,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format, differenceInDays } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const ObservationBlock = ({
  client,
  isAdmin,
  onMarkAsRead,
}: {
  client: Client
  isAdmin: boolean
  onMarkAsRead: (id: string) => void
}) => {
  if (!client.observacoes) return null

  return (
    <div className="flex flex-col gap-1 w-full min-w-[140px] print:min-w-0 p-1.5 border rounded-md bg-card shadow-sm print:shadow-none print:border-none print:p-0 print:bg-transparent overflow-hidden">
      {!client.observacao_lida ? (
        <>
          <div className="flex items-center justify-between gap-2 flex-wrap print:hidden">
            <div className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full text-[9px] font-semibold inline-flex items-center gap-1 w-fit tracking-wide">
              <AlertTriangle className="w-2.5 h-2.5" /> PENDENTE
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkAsRead(client.id)
                }}
                className="h-5 px-1.5 py-0 text-blue-600 hover:bg-blue-50 text-[9px] font-semibold w-fit transition-colors rounded-full"
              >
                <Check className="w-2.5 h-2.5 mr-1" strokeWidth={2.5} /> Marcar lida
              </Button>
            )}
          </div>
          <div className="hidden print:block text-[9px] text-amber-700 font-semibold mb-0.5">
            [Pendente]
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-xs text-foreground truncate cursor-help text-left font-medium opacity-90 hover:opacity-100 transition-opacity w-full block print:whitespace-normal print:break-words print:text-[9px] print:leading-tight">
                {client.observacoes}
              </div>
            </TooltipTrigger>
            <TooltipContent
              className="text-sm observation-tooltip"
              style={{
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                width: '250px',
              }}
              side="top"
            >
              {client.observacoes}
            </TooltipContent>
          </Tooltip>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-wrap print:hidden">
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full text-[9px] font-semibold inline-flex items-center gap-1 w-fit tracking-wide">
              <Check className="w-2.5 h-2.5" strokeWidth={2.5} /> (Obs. Lida)
            </div>
            {client.data_leitura_observacao && (
              <div className="text-[9px] text-muted-foreground font-medium">
                {format(new Date(client.data_leitura_observacao), 'dd/MM/yyyy HH:mm')}
              </div>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-xs text-foreground truncate cursor-help text-left font-medium opacity-80 hover:opacity-100 transition-opacity w-full block print:whitespace-normal print:break-words print:text-[9px] print:leading-tight">
                {client.observacoes}
              </div>
            </TooltipTrigger>
            <TooltipContent
              className="text-sm observation-tooltip"
              style={{
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                width: '250px',
              }}
              side="top"
            >
              {client.observacoes}
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  )
}

interface ClienteListProps {
  clients: Client[]
  alertSettings?: any
  onEdit: (client: Client) => void
  onDelete: (id: string) => void
  onBaixa: (id: string) => void
  onReverse?: (id: string) => void
  isRestrictedArea?: boolean
}

const ConfigBadge = ({ name, color }: { name?: string; color?: string }) => {
  const displayColor = color || '#e2e8f0'
  const displayName = name || '-'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0 print:w-1.5 print:h-1.5"
        style={{ backgroundColor: displayColor }}
      />
      <span className="text-sm truncate font-medium text-muted-foreground print:text-[9px] print:leading-tight print:whitespace-normal print:break-words">
        {displayName}
      </span>
    </div>
  )
}

export function ClienteList({
  clients,
  alertSettings,
  onEdit,
  onDelete,
  onBaixa,
  onReverse,
  isRestrictedArea = false,
}: ClienteListProps) {
  const { user } = useAuth()
  const isOperator = user?.role?.toLowerCase() === 'operator'
  const isAdmin = user?.role?.toLowerCase() === 'admin'
  const [reportClient, setReportClient] = useState<Client | null>(null)

  const handleMarkAsRead = async (id: string) => {
    try {
      const { updateClient } = await import('@/services/clients')
      await updateClient(id, {
        observacao_lida: true,
        data_leitura_observacao: new Date().toISOString(),
      })
      toast({ title: 'Sucesso', description: 'Observação marcada como lida.' })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar observação.',
        variant: 'destructive',
      })
    }
  }
  const [copiedCnpj, setCopiedCnpj] = useState<string | null>(null)

  const handleCopyCnpj = (cnpj: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(cnpj)
    setCopiedCnpj(cnpj)
    toast({ title: 'Copiado', description: 'CNPJ copiado para a área de transferência.' })
    setTimeout(() => setCopiedCnpj(null), 2000)
  }

  const handleGenerateReport = (client: Client) => {
    setReportClient(client)
  }

  const renderActions = (client: Client) => {
    const showEdit = !isRestrictedArea
    const isBaixa = client.expand?.status?.name?.toUpperCase() === 'BAIXA'
    const showBaixa = !isOperator && !isBaixa && onBaixa && !isRestrictedArea
    const showEstorno = isBaixa && onReverse && !isOperator
    const showDelete = !isOperator

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 print:hidden">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 print:hidden">
          {showEdit && (
            <DropdownMenuItem onClick={() => onEdit(client)}>
              <Edit className="mr-2 h-4 w-4" /> Editar Cliente
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => handleGenerateReport(client)}>
            <FileText className="mr-2 h-4 w-4" /> Gerar Relatório
          </DropdownMenuItem>

          {showBaixa && (
            <DropdownMenuItem
              onClick={() => onBaixa(client.id)}
              className="text-emerald-600 focus:text-emerald-600"
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Realizar Baixa
            </DropdownMenuItem>
          )}

          {showEstorno && (
            <DropdownMenuItem
              onClick={() => onReverse!(client.id)}
              className="text-orange-600 focus:text-orange-600"
            >
              <Undo2 className="mr-2 h-4 w-4" /> Estornar Baixa
            </DropdownMenuItem>
          )}

          {showDelete && (
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
      <div className="hidden md:block print:block rounded-2xl border border-slate-100 bg-white/50 backdrop-blur-sm shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden w-full print:border-none print:shadow-none print:rounded-none">
        <div className="overflow-x-auto w-full pb-2 print:overflow-visible print:p-0">
          <Table className="min-w-max w-full print:min-w-0 print:w-full print:table-fixed print:text-[10px]">
            <TableHeader>
              <TableRow className="bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50/50 border-b-slate-100 dark:border-b-slate-800 print:bg-transparent print:border-b-black">
                <TableHead className="font-medium text-slate-500 whitespace-nowrap min-w-[200px] print:min-w-0 print:w-[22%] print:whitespace-normal print:px-1 print:py-2 print:text-[10px]">
                  CNPJ / Razão Social
                </TableHead>
                <TableHead className="font-medium text-slate-500 whitespace-nowrap print:whitespace-normal print:w-[18%] print:px-1 print:py-2 print:text-[10px]">
                  Cliente
                </TableHead>
                <TableHead className="font-medium text-slate-500 whitespace-nowrap print:whitespace-normal print:w-[12%] print:px-1 print:py-2 print:text-[10px]">
                  Colaborador
                </TableHead>
                <TableHead className="font-medium text-slate-500 whitespace-nowrap print:whitespace-normal print:w-[12%] print:px-1 print:py-2 print:text-[10px]">
                  Solicitação
                </TableHead>
                <TableHead className="font-medium text-slate-500 whitespace-nowrap print:whitespace-normal print:w-[10%] print:px-1 print:py-2 print:text-[10px]">
                  Status
                </TableHead>
                <TableHead className="font-medium text-slate-500 whitespace-nowrap print:whitespace-normal print:w-[8%] print:px-1 print:py-2 print:text-[10px]">
                  Pgto
                </TableHead>
                <TableHead className="font-medium text-slate-500 min-w-[250px] print:min-w-0 print:w-[10%] print:whitespace-normal print:px-1 print:py-2 print:text-[10px]">
                  Obs
                </TableHead>
                <TableHead className="font-medium text-slate-500 whitespace-nowrap print:whitespace-normal print:w-[8%] print:px-1 print:py-2 print:text-[10px]">
                  Data
                </TableHead>
                <TableHead className="w-[60px] print:hidden sticky right-0 bg-card"></TableHead>
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
              {clients.map((client) => {
                const days = client.created
                  ? differenceInDays(new Date(), new Date(client.created))
                  : 0
                const statusName = client.expand?.status?.name?.toUpperCase() || ''
                const isPending =
                  statusName !== 'BAIXA' && statusName !== 'CONCLUÍDO' && statusName !== 'CONCLUIDO'
                const isCritical = alertSettings && days >= alertSettings.critical_days
                const isOld = alertSettings && !isCritical && days >= alertSettings.old_days
                const showCritical = isPending && isCritical
                const showOld = isPending && isOld

                return (
                  <TableRow
                    key={client.id}
                    className={cn(
                      'group transition-colors hover:bg-muted/30 print:break-inside-avoid',
                      showCritical &&
                        'bg-destructive/5 hover:bg-destructive/10 dark:bg-destructive/10 dark:hover:bg-destructive/20',
                    )}
                  >
                    <TableCell className="align-top print:px-1 print:py-2 print:break-words">
                      <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 print:text-[10px] print:leading-tight">
                        <span className="print:block">{client.razao_social}</span>
                        {showCritical && (
                          <Badge
                            variant="destructive"
                            className="h-5 px-1.5 text-[10px] flex gap-1 items-center font-medium print:hidden"
                          >
                            <AlertTriangle className="w-3 h-3" /> Crítica
                          </Badge>
                        )}
                        {showOld && (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[10px] flex gap-1 items-center font-medium border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-500 print:hidden"
                          >
                            <Clock className="w-3 h-3" /> Antiga
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 group/cnpj print:text-[9px] print:leading-tight">
                        {client.cnpj}
                        <button
                          onClick={(e) => handleCopyCnpj(client.cnpj, e)}
                          className="text-muted-foreground/50 hover:text-foreground transition-colors print:hidden opacity-0 group-hover/cnpj:opacity-100 focus:opacity-100"
                          title="Copiar CNPJ"
                        >
                          {copiedCnpj === client.cnpj ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      <div className="mt-1.5 print:mt-1">
                        <ConfigBadge
                          name={client.expand?.categoria?.name}
                          color={client.expand?.categoria?.color}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="align-top font-medium text-sm print:px-1 print:py-2 print:text-[10px] print:break-words print:leading-tight">
                      {client.nome_cliente}
                    </TableCell>
                    <TableCell className="align-top print:px-1 print:py-2 print:break-words">
                      <ConfigBadge
                        name={client.expand?.colaborador?.name}
                        color={client.expand?.colaborador?.color}
                      />
                    </TableCell>
                    <TableCell className="align-top print:px-1 print:py-2 print:break-words">
                      <ConfigBadge
                        name={client.expand?.solicitacao?.name}
                        color={client.expand?.solicitacao?.color}
                      />
                    </TableCell>
                    <TableCell className="align-top print:px-1 print:py-2 print:break-words">
                      <ConfigBadge
                        name={client.expand?.status?.name}
                        color={client.expand?.status?.color}
                      />
                    </TableCell>
                    <TableCell className="align-top print:px-1 print:py-2 print:break-words">
                      <ConfigBadge
                        name={client.expand?.pgto?.name}
                        color={client.expand?.pgto?.color}
                      />
                    </TableCell>
                    <TableCell className="align-top max-w-[300px] print:max-w-none print:px-1 print:py-2 print:break-words">
                      <ObservationBlock
                        client={client}
                        isAdmin={isAdmin}
                        onMarkAsRead={handleMarkAsRead}
                      />
                    </TableCell>
                    <TableCell className="align-top text-sm text-primary font-medium print:text-[10px] print:px-1 print:py-2 print:break-words text-slate-800 dark:text-slate-200">
                      {client.created ? format(new Date(client.created), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'align-top print:hidden sticky right-0 backdrop-blur-sm',
                        showCritical ? 'bg-red-50/90 dark:bg-red-950/90' : 'bg-card/90',
                      )}
                    >
                      {renderActions(client)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden print:hidden">
        {clients.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-card border rounded-xl shadow-sm">
            Nenhum cliente encontrado.
          </div>
        )}
        {clients.map((client) => {
          const days = client.created ? differenceInDays(new Date(), new Date(client.created)) : 0
          const statusName = client.expand?.status?.name?.toUpperCase() || ''
          const isPending =
            statusName !== 'BAIXA' && statusName !== 'CONCLUÍDO' && statusName !== 'CONCLUIDO'
          const isCritical = alertSettings && days >= alertSettings.critical_days
          const isOld = alertSettings && !isCritical && days >= alertSettings.old_days
          const showCritical = isPending && isCritical
          const showOld = isPending && isOld

          return (
            <Card
              key={client.id}
              className={cn(
                'overflow-hidden rounded-xl shadow-sm transition-colors',
                showCritical && 'border-destructive bg-destructive/5 dark:bg-destructive/10',
              )}
            >
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-foreground">{client.razao_social}</h4>
                      {showCritical && (
                        <Badge
                          variant="destructive"
                          className="h-5 px-1.5 text-[10px] flex gap-1 items-center font-medium"
                        >
                          <AlertTriangle className="w-3 h-3" /> Crítica
                        </Badge>
                      )}
                      {showOld && (
                        <Badge
                          variant="outline"
                          className="h-5 px-1.5 text-[10px] flex gap-1 items-center font-medium border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-500"
                        >
                          <Clock className="w-3 h-3" /> Antiga
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                      {client.cnpj}
                    </p>
                    <p className="text-sm font-medium mt-2">Cliente: {client.nome_cliente}</p>
                  </div>
                  {renderActions(client)}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                  <ConfigBadge
                    name={client.expand?.status?.name}
                    color={client.expand?.status?.color}
                  />
                  <ConfigBadge
                    name={client.expand?.categoria?.name}
                    color={client.expand?.categoria?.color}
                  />
                </div>
                {client.observacoes && (
                  <div className="mt-4 pt-4 border-t">
                    <ObservationBlock
                      client={client}
                      isAdmin={isAdmin}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={!!reportClient} onOpenChange={(open) => !open && setReportClient(null)}>
        <DialogContent className="printable-modal sm:max-w-md print:w-full print:max-w-none print:shadow-none print:border-none print:p-0 bg-background">
          <DialogHeader className="print:hidden">
            <DialogTitle>Relatório do Cliente</DialogTitle>
          </DialogHeader>
          {reportClient && (
            <div className="space-y-4 py-4 print:py-0 print:block">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="col-span-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                    Razão Social
                  </h4>
                  <p className="font-medium text-base mt-1">{reportClient.razao_social}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                    CNPJ
                  </h4>
                  <p className="font-medium text-base mt-1">{reportClient.cnpj}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                    Cliente
                  </h4>
                  <p className="font-medium text-base mt-1">{reportClient.nome_cliente}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                    Data de Cadastro
                  </h4>
                  <p className="font-medium text-base mt-1">
                    {reportClient.created
                      ? format(new Date(reportClient.created), 'dd/MM/yyyy')
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}{' '}
          <DialogFooter className="print:hidden mt-6">
            <Button variant="outline" onClick={() => setReportClient(null)}>
              Fechar
            </Button>
            <Button onClick={() => window.print()} className="bg-primary text-primary-foreground">
              <FileText className="w-4 h-4 mr-2" /> Imprimir Relatório
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
