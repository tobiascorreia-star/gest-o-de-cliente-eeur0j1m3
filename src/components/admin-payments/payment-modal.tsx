import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { AdminPayment } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Partial<AdminPayment>) => Promise<void>
  initialData?: AdminPayment | null
  defaultMonth?: number
  defaultYear?: number
  defaultOwner?: string
}

export function PaymentModal({
  open,
  onOpenChange,
  onSave,
  initialData,
  defaultMonth,
  defaultYear,
  defaultOwner,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const donoRef = useRef<HTMLInputElement>(null)
  const descricaoRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<Partial<AdminPayment>>({
    descricao: '',
    dono_pagamento: '',
    data_notificacao: '',
    observacao: '',
    mes_referencia: new Date().getMonth() + 1,
    ano_referencia: new Date().getFullYear(),
    status: false,
  })

  useEffect(() => {
    if (open) {
      setSubmitted(false)
      if (initialData) {
        setFormData({
          descricao: initialData.descricao,
          dono_pagamento: initialData.dono_pagamento,
          data_notificacao: initialData.data_notificacao
            ? initialData.data_notificacao.substring(0, 10)
            : '',
          observacao: initialData.observacao || '',
          mes_referencia: initialData.mes_referencia,
          ano_referencia: initialData.ano_referencia,
          status: initialData.status,
        })
      } else {
        setFormData({
          descricao: '',
          dono_pagamento: defaultOwner || '',
          data_notificacao: '',
          observacao: '',
          mes_referencia: defaultMonth || new Date().getMonth() + 1,
          ano_referencia: defaultYear || new Date().getFullYear(),
          status: false,
        })
      }
    }
  }, [open, initialData, defaultMonth, defaultYear, defaultOwner])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)

    if (!formData.data_notificacao) {
      return
    }

    setLoading(true)
    try {
      let data_notificacao = ''
      if (formData.data_notificacao) {
        const dateObj = new Date(`${formData.data_notificacao}T12:00:00Z`)
        if (!isNaN(dateObj.getTime())) {
          data_notificacao = dateObj.toISOString()
        }
      }

      const payload = {
        ...formData,
        data_notificacao,
      }
      await onSave(payload)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          setTimeout(() => {
            if (defaultOwner && !initialData && descricaoRef.current) {
              descricaoRef.current.focus()
              const length = descricaoRef.current.value.length
              descricaoRef.current.setSelectionRange(length, length)
            } else if (donoRef.current) {
              donoRef.current.focus()
              const length = donoRef.current.value.length
              donoRef.current.setSelectionRange(length, length)
            }
          }, 0)
        }}
      >
        <DialogHeader>
          {' '}
          <DialogTitle>{initialData ? 'Editar Pagamento' : 'Novo Pagamento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mês Referência</Label>
              <Input
                type="number"
                min="1"
                max="12"
                required
                value={formData.mes_referencia}
                onChange={(e) =>
                  setFormData({ ...formData, mes_referencia: parseInt(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Ano Referência</Label>
              <Input
                type="number"
                required
                value={formData.ano_referencia}
                onChange={(e) =>
                  setFormData({ ...formData, ano_referencia: parseInt(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dono do Pagamento</Label>
            <Input
              ref={donoRef}
              required
              placeholder="Ex: Tobias, Empresa X"
              value={formData.dono_pagamento}
              onChange={(e) => setFormData({ ...formData, dono_pagamento: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              ref={descricaoRef}
              required
              placeholder="Ex: Mensalidade Sistema"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            />
          </div>
          <div className="space-y-2 flex flex-col">
            <Label>Data de Notificação</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData.data_notificacao && 'text-muted-foreground',
                    submitted && !formData.data_notificacao && 'border-red-500',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.data_notificacao ? (
                    format(new Date(`${formData.data_notificacao}T12:00:00Z`), 'PPP', {
                      locale: ptBR,
                    })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={
                    formData.data_notificacao
                      ? new Date(`${formData.data_notificacao}T12:00:00Z`)
                      : undefined
                  }
                  onSelect={(date) => {
                    if (date) {
                      setFormData({ ...formData, data_notificacao: format(date, 'yyyy-MM-dd') })
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {submitted && !formData.data_notificacao && (
              <span className="text-[10px] text-red-500">Data de notificação é obrigatória</span>
            )}
          </div>
          <div className="space-y-2">
            <Label>Observação (Opcional)</Label>
            <Textarea
              value={formData.observacao}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
