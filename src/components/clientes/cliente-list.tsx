import { useState } from 'react'
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

interface ClienteListProps {
  clients: Client[]
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
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: displayColor }}
      />
      <span className="text-sm truncate font-medium text-muted-foreground">{displayName}</span>
    </div>
  )
}

export function ClienteList({
  clients,
  onEdit,
  onDelete,
  onBaixa,
  onReverse,
  isRestrictedArea = false,
}: ClienteListProps) {
  const { currentUser } = useApp()
  const isOperator = currentUser?.role === 'Operator'
  const [reportClient, setReportClient] = useState<Client | null>(null)
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
      <div className="hidden md:block print:block rounded-xl border bg-card shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full pb-2">
          <Table className="min-w-max w-full">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-b-border/50">
                <TableHead className="font-semibold whitespace-nowrap min-w-[200px]">
                  CNPJ / Razão Social
                </TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Cliente</TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Colaborador</TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Solicitação</TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Status</TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Pgto</TableHead>
                <TableHead className="font-semibold max-w-[200px]">Obs</TableHead>
                <TableHead className="font-semibold whitespace-nowrap">Data</TableHead>
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
              {clients.map((client) => (
                <TableRow
                  key={client.id}
                  className="group transition-colors hover:bg-muted/30 print:break-inside-avoid"
                >
                  <TableCell className="align-top">
                    <div className="font-semibold text-foreground">{client.razao_social}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 group/cnpj">
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
                    <div className="mt-1.5">
                      <ConfigBadge
                        name={client.expand?.categoria?.name}
                        color={client.expand?.categoria?.color}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="align-top font-medium text-sm">
                    {client.nome_cliente}
                  </TableCell>
                  <TableCell className="align-top">
                    <ConfigBadge
                      name={client.expand?.colaborador?.name}
                      color={client.expand?.colaborador?.color}
                    />
                  </TableCell>
                  <TableCell className="align-top">
                    <ConfigBadge
                      name={client.expand?.solicitacao?.name}
                      color={client.expand?.solicitacao?.color}
                    />
                  </TableCell>
                  <TableCell className="align-top">
                    <ConfigBadge
                      name={client.expand?.status?.name}
                      color={client.expand?.status?.color}
                    />
                  </TableCell>
                  <TableCell className="align-top">
                    <ConfigBadge
                      name={client.expand?.pgto?.name}
                      color={client.expand?.pgto?.color}
                    />
                  </TableCell>
                  <TableCell
                    className="align-top text-xs text-muted-foreground max-w-[200px] truncate"
                    title={client.observacoes}
                  >
                    {client.observacoes || '-'}
                  </TableCell>
                  <TableCell className="align-top text-sm text-primary font-medium">
                    {client.created ? format(new Date(client.created), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell className="align-top print:hidden sticky right-0 bg-card/90 backdrop-blur-sm">
                    {renderActions(client)}
                  </TableCell>
                </TableRow>
              ))}
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
        {clients.map((client) => (
          <Card key={client.id} className="overflow-hidden rounded-xl shadow-sm">
            <CardContent className="p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-foreground">{client.razao_social}</h4>
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
            </CardContent>
          </Card>
        ))}
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
              </div>
            </div>
          )}
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
