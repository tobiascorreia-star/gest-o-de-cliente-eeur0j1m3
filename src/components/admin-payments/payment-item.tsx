import { AdminPayment } from '@/types'
import { useState, useRef, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Pencil,
  Trash2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Archive,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateAdminPayment, deleteAdminPayment } from '@/services/admin_payments'
import { toast } from 'sonner'
import { format, startOfDay } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { isOverdueBusiness, isTomorrowBusiness, getEffectiveDueDate } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Props {
  item: AdminPayment
  onEdit: (item: AdminPayment) => void
}

export function PaymentItem({ item, onEdit }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [desc, setDesc] = useState(item.descricao)
  const [isExpanded, setIsExpanded] = useState(!item.status)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false)
  const [isUnarchiveDialogOpen, setIsUnarchiveDialogOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDesc(item.descricao)
  }, [item.descricao])

  useEffect(() => {
    setIsExpanded(!item.status)
  }, [item.status])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleSaveDesc = async () => {
    if (desc.trim() !== item.descricao && desc.trim()) {
      const oldDesc = item.descricao
      window.dispatchEvent(
        new CustomEvent('admin-payment-optimistic', {
          detail: { id: item.id, updates: { descricao: desc.trim() } },
        }),
      )
      try {
        await updateAdminPayment(item.id, { descricao: desc.trim() })
        toast.success('Descrição atualizada')
      } catch {
        toast.error('Erro ao atualizar descrição')
        window.dispatchEvent(
          new CustomEvent('admin-payment-optimistic', {
            detail: { id: item.id, updates: { descricao: oldDesc } },
          }),
        )
        setDesc(oldDesc)
      }
    } else {
      setDesc(item.descricao)
    }
    setIsEditing(false)
  }
  const handleToggle = async () => {
    const newStatus = !item.status
    const data_pagamento_realizado = newStatus ? new Date().toISOString() : ''

    window.dispatchEvent(
      new CustomEvent('admin-payment-optimistic', {
        detail: { id: item.id, updates: { status: newStatus, data_pagamento_realizado } },
      }),
    )

    try {
      await updateAdminPayment(item.id, {
        status: newStatus,
        data_pagamento_realizado,
      })
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent('admin-payment-optimistic', {
          detail: {
            id: item.id,
            updates: {
              status: item.status,
              data_pagamento_realizado: item.data_pagamento_realizado,
            },
          },
        }),
      )
      toast.error('Erro ao atualizar status')
    }
  }

  const handleDelete = async () => {
    setIsDeleteDialogOpen(false)
    try {
      await deleteAdminPayment(item.id)
      toast.success('Excluído com sucesso')
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const handleArchive = async () => {
    setIsArchiveDialogOpen(false)
    try {
      await updateAdminPayment(item.id, { archived: true })
      toast.success('Arquivado com sucesso')
      window.dispatchEvent(
        new CustomEvent('admin-payment-optimistic', {
          detail: { id: item.id, updates: { archived: true } },
        }),
      )
    } catch {
      toast.error('Erro ao arquivar')
    }
  }

  const handleUnarchive = async () => {
    setIsUnarchiveDialogOpen(false)
    try {
      await updateAdminPayment(item.id, { archived: false })
      toast.success('Restaurado com sucesso')
      window.dispatchEvent(
        new CustomEvent('admin-payment-optimistic', {
          detail: { id: item.id, updates: { archived: false } },
        }),
      )
    } catch {
      toast.error('Erro ao restaurar')
    }
  }

  const notifDate = item.data_notificacao
    ? new Date(item.data_notificacao.split(' ')[0] + 'T00:00:00')
    : null

  const validNotifDate = notifDate && !isNaN(notifDate.getTime()) ? notifDate : null

  let isOverdue = false
  let isNearDeadline = false
  let isToday = false

  if (!item.status && validNotifDate) {
    try {
      isOverdue = isOverdueBusiness(validNotifDate)
      isNearDeadline = isTomorrowBusiness(validNotifDate)
      isToday = getEffectiveDueDate(validNotifDate).getTime() === startOfDay(new Date()).getTime()
    } catch {
      // Ignore calculation errors for invalid dates
    }
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg transition-colors border shadow-sm',
        isOverdue
          ? 'bg-red-50/30 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 relative overflow-hidden'
          : isToday
            ? 'bg-orange-50/40 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50 relative overflow-hidden'
            : isNearDeadline
              ? 'bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-900/50 relative overflow-hidden'
              : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800',
        'hover:border-slate-300 dark:hover:border-slate-700',
      )}
    >
      {isOverdue && (
        <div className="absolute inset-y-0 left-0 w-1 bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
      )}
      {isToday && (
        <div className="absolute inset-y-0 left-0 w-1 bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
      )}
      {isNearDeadline && (
        <div className="absolute inset-y-0 left-0 w-1 bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
      )}
      <Checkbox
        checked={item.status}
        onCheckedChange={handleToggle}
        className="mt-1 transition-all"
      />
      <div className={cn('flex-1 min-w-0 transition-opacity', item.status && 'opacity-60')}>
        <div className="flex items-center gap-2 flex-wrap">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onBlur={handleSaveDesc}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveDesc()}
              className="flex-1 min-w-[120px] text-sm font-medium bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          ) : (
            <>
              <p
                onClick={() => setIsEditing(true)}
                className={cn(
                  'text-sm font-medium text-slate-900 dark:text-slate-100 cursor-text hover:bg-slate-100 dark:hover:bg-slate-800 px-1 -ml-1 rounded transition-colors break-words line-clamp-2 md:line-clamp-none',
                  item.status && 'line-through text-slate-500',
                  isOverdue && 'text-red-600 dark:text-red-400 font-bold',
                )}
              >
                {item.descricao}
              </p>
              {isOverdue && (
                <Badge
                  variant="destructive"
                  className="text-[10px] h-5 px-1.5 py-0 uppercase tracking-wider animate-pulse whitespace-nowrap"
                >
                  Pagamento Vencido
                </Badge>
              )}
              {isToday && (
                <Badge
                  variant="default"
                  className="text-[10px] h-5 px-1.5 py-0 uppercase tracking-wider bg-orange-500 hover:bg-orange-600 text-white whitespace-nowrap animate-pulse"
                >
                  Vencendo Hoje
                </Badge>
              )}
              {isNearDeadline && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 px-1.5 py-0 uppercase tracking-wider border-yellow-500 text-yellow-600 dark:border-yellow-400 dark:text-yellow-400 whitespace-nowrap animate-pulse"
                >
                  Vencendo em 1 dia
                </Badge>
              )}{' '}
            </>
          )}
          {item.status && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-auto text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {isExpanded && (
          <>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {item.status && item.data_pagamento_realizado && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                  <Clock className="w-3 h-3" />
                  Pago em:{' '}
                  {(() => {
                    try {
                      const d = new Date(item.data_pagamento_realizado.replace(' ', 'T'))
                      return isNaN(d.getTime()) ? 'Data inválida' : format(d, 'dd/MM/yyyy HH:mm')
                    } catch {
                      return 'Data inválida'
                    }
                  })()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
              <span
                className={cn(
                  'flex items-center gap-1',
                  isOverdue && 'text-red-500 font-semibold',
                  isToday && 'text-orange-500 font-semibold',
                  isNearDeadline && 'text-yellow-500 font-semibold',
                )}
              >
                {(isOverdue || isToday || isNearDeadline) && (
                  <AlertCircle
                    className={cn(
                      'w-3 h-3',
                      (isOverdue || isToday || isNearDeadline) && 'animate-pulse',
                    )}
                  />
                )}{' '}
                {item.data_notificacao
                  ? `Vence: ${
                      validNotifDate
                        ? (() => {
                            try {
                              return format(getEffectiveDueDate(validNotifDate), 'dd/MM/yyyy')
                            } catch {
                              return 'Data inválida'
                            }
                          })()
                        : 'Data inválida'
                    }`
                  : 'Sem vencimento'}
              </span>
              {item.observacao && (
                <span className="truncate max-w-[200px] text-slate-500" title={item.observacao}>
                  • {item.observacao}
                </span>
              )}
              <span className="text-slate-500 whitespace-nowrap">
                • Ref: {item.mes_referencia?.toString().padStart(2, '0') || '00'}/
                {item.ano_referencia || '0000'}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity self-start -mt-1 -mr-1 shrink-0 bg-white/50 dark:bg-slate-950/50 md:bg-transparent rounded-md ml-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-primary"
          onClick={() => onEdit(item)}
          title="Editar"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        {item.archived ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-emerald-600"
            onClick={() => setIsUnarchiveDialogOpen(true)}
            title="Restaurar para Ativo"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-amber-600"
            onClick={() => setIsArchiveDialogOpen(true)}
            title="Arquivar"
          >
            <Archive className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-destructive"
          onClick={() => setIsDeleteDialogOpen(true)}
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o pagamento "{item.descricao}"? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja arquivar o pagamento "{item.descricao}"? Ele será movido para o
              histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isUnarchiveDialogOpen} onOpenChange={setIsUnarchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja restaurar o pagamento "{item.descricao}" para a visão ativa?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnarchive}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
