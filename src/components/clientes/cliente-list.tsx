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
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn, getClientAlertState } from '@/lib/utils'
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
    <div className="flex flex-col w-full min-w-0 mt-2 bg-muted/30 dark:bg-muted/10 border border-border/50 rounded-xl p-3 print:border-none print:bg-transparent print:p-0">
      {!client.observacao_lida ? (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-sm text-foreground/90 mb-3 text-left font-medium opacity-90 hover:opacity-100 transition-opacity w-full line-clamp-3 print:line-clamp-none print:mb-1 print:text-[10px]">
                <span className="hidden print:inline text-amber-700 font-bold mr-1">
                  [Pendente]
                </span>
                {client.observacoes}
              </div>
            </TooltipTrigger>
            <TooltipContent
              className="text-sm"
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
          <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-border/50 print:hidden">
            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-500 px-2 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3" /> Pendente
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkAsRead(client.id)
                }}
                className="h-7 px-2.5 text-blue-600 dark:text-blue-500 hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-400 text-xs font-semibold rounded-md transition-colors"
              >
                <Check className="w-3 h-3 mr-1.5" strokeWidth={2.5} /> Marcar lida
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-sm text-foreground/70 mb-3 text-left font-medium hover:text-foreground/90 transition-opacity w-full line-clamp-2 print:line-clamp-none print:mb-1 print:text-[10px]">
                {client.observacoes}
              </div>
            </TooltipTrigger>
            <TooltipContent
              className="text-sm"
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
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/50 print:hidden">
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 px-2 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle className="w-3 h-3" /> Lida
            </div>
            {client.data_leitura_observacao && (
              <div className="text-[10px] text-muted-foreground font-medium ml-auto">
                {format(new Date(client.data_leitura_observacao), 'dd/MM/yyyy HH:mm')}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

interface ClienteListProps {
  clients: Client[]
  alertSettings?: any
  notifications?: any[]
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
    <div className="flex items-center gap-1.5 min-w-0">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0 print:w-1.5 print:h-1.5"
        style={{ backgroundColor: displayColor }}
      />
      <span className="text-sm truncate font-medium text-muted-foreground print:text-[8px] print:leading-tight print:whitespace-normal print:break-words">
        {displayName}
      </span>
    </div>
  )
}

export function ClienteList({
  clients,
  alertSettings,
  notifications = [],
  onEdit,
  onDelete,
  onBaixa,
  onReverse,
  isRestrictedArea = false,
}: ClienteListProps) {
  const { user } = useAuth()
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
    const showBaixa = isAdmin && !isBaixa && onBaixa && !isRestrictedArea
    const showEstorno = isAdmin && isBaixa && onReverse
    const showDelete = isAdmin

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
              <Edit className="mr-2 h-4 w-4" /> Editar Atendimento
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
                <TableHead className="font-medium text-slate-500 whitespace-nowrap min-w-[200px] print:min-w-0 print:w-[16%] print:whitespace-normal print:px-0.5 print:py-1 print:text-[8px]">
                  CNPJ / Razão Social
                </TableHead>
                <TableHead className="font-medium text-slate-500 whitespace-nowrap print:whitespace-normal print:w-[16%] print:px-0.5 print:py-1 print:text-[8px]">
                  Cliente
                </TableHead>
                <TableHead className="font-medium text-slate-500 whitespace-nowrap print:whitespace-normal print:w-[12%] print:px-0.5 print:py-1 print:text-[8px]">
                  Colaborador
                </TableHead>
                <TableHead className="font-medium text-slate-500 whitespace-nowrap print:whitespace-normal print:w-[12%] print:px-0.5 print:py-1 print:text-[8px]">
                  Solicitação
                </TableHead>
                <TableHead className="font-medium text-slate-500 whitespace-nowrap print:whitespace-normal print:w-[10%] print:px-0.5 print:py-1 print:text-[8px]">
                  Status
                </TableHead>
                <TableHead className="font-medium text-slate-500 whitespace-nowrap print:whitespace-normal print:w-[8%] print:px-0.5 print:py-1 print:text-[8px]">
                  Pgto
                </TableHead>
                <TableHead className="font-medium text-slate-500 min-w-[250px] print:min-w-0 print:w-[18%] print:whitespace-normal print:px-0.5 print:py-1 print:text-[8px]">
                  Obs
                </TableHead>
                <TableHead className="font-medium text-slate-500 whitespace-nowrap print:whitespace-normal print:w-[8%] print:px-0.5 print:py-1 print:text-[8px]">
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
                      Nenhum atendimento encontrado.
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {clients.map((client) => {
                const {
                  isCritical,
                  isModerate,
                  isOldAdmin,
                  isMonthCritical,
                  isMonthWarning,
                  daysSinceUpdated,
                } = getClientAlertState(client, alertSettings, isAdmin)

                const showCritical = isCritical || isMonthCritical
                const showWarning = isMonthWarning
                const showModerate = isModerate
                const showOldAdmin = isOldAdmin
                const showAtrasado = notifications.some((n) => n.client === client.id)
                const hasUnreadObs = Boolean(client.observacoes && !client.observacao_lida)
                const hasActiveAlert =
                  showCritical ||
                  showWarning ||
                  showModerate ||
                  showOldAdmin ||
                  hasUnreadObs ||
                  showAtrasado

                return (
                  <TableRow
                    key={client.id}
                    className={cn(
                      'group transition-colors hover:bg-muted/30 print:break-inside-avoid',
                      (showModerate || showOldAdmin || showWarning) &&
                        !showCritical &&
                        'bg-amber-50/40 hover:bg-amber-50/60 dark:bg-amber-900/10 dark:hover:bg-amber-900/20',
                      showCritical &&
                        'bg-destructive/5 hover:bg-destructive/10 dark:bg-destructive/10 dark:hover:bg-destructive/20',
                    )}
                  >
                    <TableCell className="align-top print:px-0.5 print:py-1 print:break-words">
                      <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 print:text-[8px] print:leading-tight">
                        {hasActiveAlert && (
                          <div
                            className="w-2 h-2 rounded-full bg-destructive animate-pulse shrink-0 print:hidden"
                            title="Alerta Ativo"
                          />
                        )}
                        <span className="print:block">{client.razao_social}</span>
                        {showAtrasado && (
                          <Badge
                            variant="destructive"
                            className="h-5 px-1.5 text-[10px] flex gap-1 items-center font-medium print:hidden animate-pulse shadow-sm bg-red-600 hover:bg-red-700"
                          >
                            <AlertTriangle className="w-3 h-3" /> Atrasado
                          </Badge>
                        )}
                        {!showAtrasado && isMonthCritical && (
                          <Badge
                            variant="destructive"
                            className="h-5 px-1.5 text-[10px] flex gap-1 items-center font-medium print:hidden animate-pulse shadow-sm bg-red-600 hover:bg-red-700"
                          >
                            <AlertTriangle className="w-3 h-3" /> Crítico
                          </Badge>
                        )}
                        {!showAtrasado && !isMonthCritical && showWarning && (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[10px] flex gap-1 items-center font-medium border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-500 print:hidden animate-pulse shadow-sm"
                          >
                            <AlertTriangle className="w-3 h-3" /> À Pagar
                          </Badge>
                        )}
                        {!showAtrasado && !isMonthCritical && !showWarning && isCritical && (
                          <Badge
                            variant="destructive"
                            className="h-5 px-1.5 text-[10px] flex gap-1 items-center font-medium print:hidden animate-pulse shadow-sm"
                          >
                            <AlertTriangle className="w-3 h-3" /> Crítica
                          </Badge>
                        )}
                        {!showAtrasado && !showCritical && showModerate && (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[10px] flex gap-1 items-center font-medium border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-500 print:hidden"
                          >
                            <Clock className="w-3 h-3" /> Pendente
                          </Badge>
                        )}
                        {!showAtrasado && !showCritical && !showModerate && showOldAdmin && (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[10px] flex gap-1 items-center font-medium border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-500 print:hidden"
                          >
                            <AlertTriangle className="w-3 h-3" /> Antiga
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 group/cnpj print:text-[8px] print:leading-tight">
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
                    <TableCell className="align-top font-medium text-sm print:px-0.5 print:py-1 print:text-[8px] print:break-words print:leading-tight">
                      {client.nome_cliente}
                    </TableCell>
                    <TableCell className="align-top print:px-0.5 print:py-1 print:break-words">
                      <ConfigBadge
                        name={client.expand?.colaborador?.name}
                        color={client.expand?.colaborador?.color}
                      />
                    </TableCell>
                    <TableCell className="align-top print:px-0.5 print:py-1 print:break-words">
                      <ConfigBadge
                        name={client.expand?.solicitacao?.name}
                        color={client.expand?.solicitacao?.color}
                      />
                    </TableCell>
                    <TableCell className="align-top print:px-0.5 print:py-1 print:break-words">
                      <div className="flex items-center gap-2">
                        <ConfigBadge
                          name={client.expand?.status?.name}
                          color={client.expand?.status?.color}
                        />
                        {(showModerate || showCritical || showOldAdmin || showWarning) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertTriangle
                                className={cn(
                                  'w-4 h-4 cursor-help shrink-0',
                                  showCritical
                                    ? 'text-destructive'
                                    : showOldAdmin
                                      ? 'text-purple-500'
                                      : showWarning
                                        ? 'text-yellow-500'
                                        : 'text-amber-500',
                                )}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              {isMonthCritical ? (
                                <p>Atendimento crítico: pagamento em aberto do mês anterior</p>
                              ) : showWarning ? (
                                <p>Atenção: pagamento em aberto próximo ao fim do mês</p>
                              ) : isCritical ? (
                                <p>Atendimento crítico: pendente há {daysSinceUpdated} dias</p>
                              ) : showOldAdmin ? (
                                <p>
                                  Destacada como antiga: pagamento em aberto há {daysSinceUpdated}{' '}
                                  dias
                                </p>
                              ) : (
                                <p>
                                  Atendimento pendente há {daysSinceUpdated} dias (limite:{' '}
                                  {alertSettings?.old_days})
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top print:px-0.5 print:py-1 print:break-words">
                      <ConfigBadge
                        name={client.expand?.pgto?.name}
                        color={client.expand?.pgto?.color}
                      />
                    </TableCell>
                    <TableCell className="align-top max-w-[300px] print:max-w-none print:px-0.5 print:py-1 print:break-words">
                      <ObservationBlock
                        client={client}
                        isAdmin={isAdmin}
                        onMarkAsRead={handleMarkAsRead}
                      />
                    </TableCell>
                    <TableCell className="align-top text-sm text-primary font-medium print:text-[8px] print:px-0.5 print:py-1 print:break-words text-slate-800 dark:text-slate-200">
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

      <div className="flex flex-col gap-4 md:hidden print:hidden w-full max-w-full overflow-hidden">
        {clients.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-card border rounded-xl shadow-sm mx-1">
            Nenhum atendimento encontrado.
          </div>
        )}
        {clients.map((client) => {
          const {
            isCritical,
            isModerate,
            isOldAdmin,
            isMonthCritical,
            isMonthWarning,
            daysSinceUpdated,
          } = getClientAlertState(client, alertSettings, isAdmin)

          const showCritical = isCritical || isMonthCritical
          const showWarning = isMonthWarning
          const showModerate = isModerate
          const showOldAdmin = isOldAdmin
          const showAtrasado = notifications.some((n) => n.client === client.id)
          const hasUnreadObs = Boolean(client.observacoes && !client.observacao_lida)
          const hasActiveAlert =
            showCritical ||
            showWarning ||
            showModerate ||
            showOldAdmin ||
            hasUnreadObs ||
            showAtrasado

          return (
            <Card
              key={client.id}
              className={cn(
                'w-full max-w-full overflow-hidden rounded-xl shadow-sm transition-colors border',
                (showModerate || showOldAdmin || showWarning) &&
                  !showCritical &&
                  'border-amber-200/50 bg-amber-50/40 dark:bg-amber-900/10 dark:border-amber-900/50',
                showCritical && 'border-destructive/30 bg-destructive/5 dark:bg-destructive/10',
              )}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col gap-3 w-full max-w-full overflow-hidden">
                <div className="flex justify-between items-start gap-2 w-full max-w-full overflow-hidden">
                  <div className="min-w-0 flex-1 w-full max-w-full overflow-hidden flex flex-col gap-1">
                    <div className="flex items-start gap-2 w-full">
                      {hasActiveAlert && (
                        <div
                          className="w-2 h-2 rounded-full bg-destructive animate-pulse shrink-0 mt-1.5 print:hidden"
                          title="Alerta Ativo"
                        />
                      )}
                      <h4 className="font-bold text-[15px] leading-snug text-foreground break-words w-full">
                        {client.razao_social}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                      {client.cnpj}
                    </p>
                    <p className="text-sm font-medium mt-1 break-words">
                      Cliente: {client.nome_cliente}
                    </p>
                  </div>

                  <div className="shrink-0 -mt-1 -mr-2">{renderActions(client)}</div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                  <div className="flex items-center gap-2">
                    <ConfigBadge
                      name={client.expand?.status?.name}
                      color={client.expand?.status?.color}
                    />
                    {(showModerate || showCritical || showOldAdmin || showWarning) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertTriangle
                            className={cn(
                              'w-3.5 h-3.5 shrink-0 cursor-help',
                              showCritical
                                ? 'text-destructive'
                                : showOldAdmin
                                  ? 'text-purple-500'
                                  : showWarning
                                    ? 'text-yellow-500'
                                    : 'text-amber-500',
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {isMonthCritical ? (
                            <p>Atendimento crítico: pagamento em aberto do mês anterior</p>
                          ) : showWarning ? (
                            <p>Atenção: pagamento em aberto próximo ao fim do mês</p>
                          ) : isCritical ? (
                            <p>Atendimento crítico: pendente há {daysSinceUpdated} dias</p>
                          ) : showOldAdmin ? (
                            <p>
                              Destacada como antiga: pagamento em aberto há {daysSinceUpdated} dias
                            </p>
                          ) : (
                            <p>
                              Atendimento pendente há {daysSinceUpdated} dias (limite:{' '}
                              {alertSettings?.old_days})
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <ConfigBadge
                    name={client.expand?.categoria?.name}
                    color={client.expand?.categoria?.color}
                  />
                  {showAtrasado && (
                    <Badge
                      variant="destructive"
                      className="h-5 px-1.5 text-[10px] flex gap-1 items-center font-medium shadow-sm bg-red-600 hover:bg-red-700"
                    >
                      <AlertTriangle className="w-2.5 h-2.5" /> Atrasado
                    </Badge>
                  )}
                  {!showAtrasado && isMonthCritical && (
                    <Badge
                      variant="destructive"
                      className="h-5 px-1.5 text-[10px] flex gap-1 items-center font-medium shadow-sm bg-red-600 hover:bg-red-700"
                    >
                      <AlertTriangle className="w-2.5 h-2.5" /> Crítico
                    </Badge>
                  )}
                  {!showAtrasado && !isMonthCritical && showWarning && (
                    <Badge
                      variant="outline"
                      className="h-5 px-1.5 text-[10px] flex gap-1 items-center font-medium border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-500 shadow-sm"
                    >
                      <AlertTriangle className="w-2.5 h-2.5" /> À Pagar
                    </Badge>
                  )}
                  {!showAtrasado && !isMonthCritical && !showWarning && isCritical && (
                    <Badge
                      variant="destructive"
                      className="h-5 px-1.5 text-[10px] flex gap-1 items-center font-medium shadow-sm"
                    >
                      <AlertTriangle className="w-2.5 h-2.5" /> Crítica
                    </Badge>
                  )}
                  {!showAtrasado && !showCritical && showModerate && (
                    <Badge
                      variant="outline"
                      className="h-5 px-1.5 text-[10px] flex gap-1 items-center font-medium border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-500"
                    >
                      <Clock className="w-2.5 h-2.5" /> Pendente
                    </Badge>
                  )}
                  {!showAtrasado && !showCritical && !showModerate && showOldAdmin && (
                    <Badge
                      variant="outline"
                      className="h-5 px-1.5 text-[10px] flex gap-1 items-center font-medium border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-500 print:hidden"
                    >
                      <AlertTriangle className="w-2.5 h-2.5" /> Antiga
                    </Badge>
                  )}
                </div>

                {client.observacoes && (
                  <ObservationBlock
                    client={client}
                    isAdmin={isAdmin}
                    onMarkAsRead={handleMarkAsRead}
                  />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={!!reportClient} onOpenChange={(open) => !open && setReportClient(null)}>
        <DialogContent className="printable-modal sm:max-w-md print:w-full print:max-w-none print:shadow-none print:border-none print:p-0 bg-background">
          <DialogHeader className="print:hidden">
            <DialogTitle>Relatório do Atendimento</DialogTitle>
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
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                    Status
                  </h4>
                  <p className="font-medium text-base mt-1">
                    {reportClient.expand?.status?.name || '-'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                    Colaborador
                  </h4>
                  <p className="font-medium text-base mt-1">
                    {reportClient.expand?.colaborador?.name || '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                    Observações
                  </h4>
                  <p className="font-medium text-base mt-1 whitespace-pre-wrap text-sm">
                    {reportClient.observacoes || 'Nenhuma observação registrada.'}
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
