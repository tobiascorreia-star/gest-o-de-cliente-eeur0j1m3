import { useState, useEffect } from 'react'
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
import { AdminPayment } from '@/types'

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
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
              required
              autoFocus
              placeholder="Ex: Tobias, Empresa X"
              value={formData.dono_pagamento}
              onChange={(e) => setFormData({ ...formData, dono_pagamento: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              required
              placeholder="Ex: Mensalidade Sistema"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Data de Notificação (Opcional)</Label>
            <Input
              type="date"
              value={formData.data_notificacao || ''}
              onChange={(e) => setFormData({ ...formData, data_notificacao: e.target.value })}
            />
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
