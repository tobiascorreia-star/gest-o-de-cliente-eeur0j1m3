import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Client } from '@/types'
import { useApp } from '@/contexts/app-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Loader2, Search } from 'lucide-react'

const formSchema = z.object({
  cnpj: z.string().min(14, 'CNPJ inválido'),
  razaoSocial: z.string().min(3, 'Razão social é obrigatória'),
  nome: z.string().min(3, 'Nome é obrigatório'),
  colaboradorId: z.string().min(1, 'Selecione um colaborador'),
  solicitacaoId: z.string().min(1, 'Selecione uma solicitação'),
  statusId: z.string().min(1, 'Selecione um status'),
  categoriaId: z.string().min(1, 'Selecione uma categoria'),
  obs: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface ClienteFormProps {
  initialData?: Client | null
  onSuccess: () => void
}

export function ClienteForm({ initialData, onSuccess }: ClienteFormProps) {
  const { colaboradores, solicitacoes, statusList, categorias, addClient, updateClient } = useApp()
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      cnpj: '',
      razaoSocial: '',
      nome: '',
      colaboradorId: '',
      solicitacaoId: '',
      statusId: '',
      categoriaId: '',
      obs: '',
    },
  })

  // Register selects manually since they aren't native inputs
  useEffect(() => {
    register('colaboradorId')
    register('solicitacaoId')
    register('statusId')
    register('categoriaId')
  }, [register])

  const cnpjValue = watch('cnpj')

  const handleAutoFetch = async () => {
    if (!cnpjValue || cnpjValue.length < 14) return
    setIsFetchingCnpj(true)
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setValue('razaoSocial', 'Empresa Auto-preenchida LTDA', { shouldValidate: true })
    setIsFetchingCnpj(false)
    toast({ title: 'CNPJ Encontrado', description: 'Razão social preenchida automaticamente.' })
  }

  const onSubmit = (data: FormData) => {
    if (initialData) {
      updateClient({ ...initialData, ...data })
      toast({ title: 'Sucesso', description: 'Cliente atualizado com sucesso!' })
    } else {
      addClient({
        id: `cli_${Date.now()}`,
        ...data,
        dataCadastro: new Date().toISOString(),
      })
      toast({ title: 'Sucesso', description: 'Cliente cadastrado com sucesso!' })
    }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <div className="flex gap-2">
            <Input
              id="cnpj"
              placeholder="00.000.000/0000-00"
              {...register('cnpj')}
              className={errors.cnpj ? 'border-destructive' : ''}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAutoFetch}
              disabled={isFetchingCnpj || !cnpjValue}
            >
              {isFetchingCnpj ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
          {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="razaoSocial">Razão Social</Label>
          <Input
            id="razaoSocial"
            {...register('razaoSocial')}
            className={errors.razaoSocial ? 'border-destructive' : ''}
          />
          {errors.razaoSocial && (
            <p className="text-xs text-destructive">{errors.razaoSocial.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Contato</Label>
          <Input
            id="nome"
            {...register('nome')}
            className={errors.nome ? 'border-destructive' : ''}
          />
          {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Colaborador Responsável</Label>
          <Select
            onValueChange={(v) => setValue('colaboradorId', v, { shouldValidate: true })}
            defaultValue={initialData?.colaboradorId}
          >
            <SelectTrigger className={errors.colaboradorId ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {colaboradores.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Solicitação</Label>
          <Select
            onValueChange={(v) => setValue('solicitacaoId', v, { shouldValidate: true })}
            defaultValue={initialData?.solicitacaoId}
          >
            <SelectTrigger className={errors.solicitacaoId ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {solicitacoes.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            onValueChange={(v) => setValue('statusId', v, { shouldValidate: true })}
            defaultValue={initialData?.statusId}
          >
            <SelectTrigger className={errors.statusId ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {statusList.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select
            onValueChange={(v) => setValue('categoriaId', v, { shouldValidate: true })}
            defaultValue={initialData?.categoriaId}
          >
            <SelectTrigger className={errors.categoriaId ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="obs">Observações</Label>
        <Textarea id="obs" {...register('obs')} rows={3} placeholder="Detalhes adicionais..." />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit">{initialData ? 'Salvar Alterações' : 'Cadastrar Cliente'}</Button>
      </div>
    </form>
  )
}
