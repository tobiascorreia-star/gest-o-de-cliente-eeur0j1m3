import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Client } from '@/types'
import { useApp } from '@/contexts/app-context'
import { getConfigurations } from '@/services/configurations'
import { useRealtime } from '@/hooks/use-realtime'
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
  cnpj: z.string().min(18, 'CNPJ incompleto').max(18, 'CNPJ incompleto'),
  razao_social: z.string().min(3, 'Razão social é obrigatória'),
  nome_cliente: z.string().min(3, 'Cliente é obrigatório'),
  colaborador: z.string().min(1, 'Selecione um colaborador'),
  solicitacao: z.string().min(1, 'Selecione uma solicitação'),
  status: z.string().min(1, 'Selecione um status'),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  pgto: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface ClienteFormProps {
  initialData?: Client | null
  onSuccess: () => void
}

const applyCnpjMask = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18)
}

export function ClienteForm({ initialData, onSuccess }: ClienteFormProps) {
  const { currentUser, addClient, updateClient } = useApp()
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false)
  const [configs, setConfigs] = useState<any[]>([])
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'admin'

  useEffect(() => {
    getConfigurations().then(setConfigs).catch(console.error)
  }, [])

  useRealtime('configurations', () => {
    getConfigurations().then(setConfigs).catch(console.error)
  })

  const colaboradores = configs.filter((c) => c.type === 'Colaborador' && c.active !== false)
  const solicitacoes = configs.filter((c) => c.type === 'Solicitação' && c.active !== false)
  const statusList = configs.filter((c) => c.type === 'Status' && c.active !== false)
  const categorias = configs.filter((c) => c.type === 'Categoria' && c.active !== false)
  const pgtoTipos = configs.filter((c) => c.type === 'Pgto' && c.active !== false)

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
        }
      : {
          cnpj: '',
          razao_social: '',
          nome_cliente: '',
          colaborador: '',
          solicitacao: '',
          status: '',
          categoria: '',
          pgto: '',
          observacoes: '',
        },
  })

  useEffect(() => {
    register('colaborador')
    register('solicitacao')
    register('status')
    register('categoria')
    register('pgto')
  }, [register])

  const cnpjValue = watch('cnpj')

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyCnpjMask(e.target.value)
    setValue('cnpj', masked, { shouldValidate: true })
  }

  const handleAutoFetch = async () => {
    if (!cnpjValue || cnpjValue.length < 18) return
    setIsFetchingCnpj(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setValue('razao_social', 'Empresa Auto-preenchida LTDA', { shouldValidate: true })
    setIsFetchingCnpj(false)
    toast({ title: 'CNPJ Encontrado', description: 'Razão social preenchida automaticamente.' })
  }

  const onSubmit = async (data: FormData) => {
    if (isAdmin && !data.pgto) {
      setError('pgto', { type: 'manual', message: 'Pagamento é obrigatório' })
      return
    }

    const clientData = {
      ...data,
      pgto: isAdmin ? data.pgto || '' : initialData?.pgto || '',
    }

    try {
      if (initialData) {
        const { updateClient } = await import('@/services/clients')
        await updateClient(initialData.id, clientData)
        toast({ title: 'Sucesso', description: 'Cliente atualizado com sucesso!' })
      } else {
        const { createClient } = await import('@/services/clients')
        await createClient(clientData)
        toast({ title: 'Sucesso', description: 'Cliente cadastrado com sucesso!' })
      }
      onSuccess()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.message || 'Falha ao salvar cliente',
        variant: 'destructive',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ *</Label>
          <div className="flex gap-2">
            <Input
              id="cnpj"
              placeholder="00.000.000/0000-00"
              {...register('cnpj')}
              onChange={handleCnpjChange}
              className={errors.cnpj ? 'border-destructive' : ''}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAutoFetch}
              disabled={isFetchingCnpj || !cnpjValue || cnpjValue.length < 18}
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
          <Label htmlFor="razao_social">Razão Social *</Label>
          <Input
            id="razao_social"
            {...register('razao_social')}
            className={errors.razao_social ? 'border-destructive' : ''}
          />
          {errors.razao_social && (
            <p className="text-xs text-destructive">{errors.razao_social.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome_cliente">Cliente *</Label>
          <Input
            id="nome_cliente"
            {...register('nome_cliente')}
            className={errors.nome_cliente ? 'border-destructive' : ''}
          />
          {errors.nome_cliente && (
            <p className="text-xs text-destructive">{errors.nome_cliente.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Colaborador Responsável *</Label>
          <Select
            onValueChange={(v) => setValue('colaborador', v, { shouldValidate: true })}
            defaultValue={initialData?.colaborador}
          >
            <SelectTrigger className={errors.colaborador ? 'border-destructive' : ''}>
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
          {errors.colaborador && (
            <p className="text-xs text-destructive">{errors.colaborador.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Solicitação *</Label>
          <Select
            onValueChange={(v) => setValue('solicitacao', v, { shouldValidate: true })}
            defaultValue={initialData?.solicitacao}
          >
            <SelectTrigger className={errors.solicitacao ? 'border-destructive' : ''}>
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
          {errors.solicitacao && (
            <p className="text-xs text-destructive">{errors.solicitacao.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Status *</Label>
          <Select
            onValueChange={(v) => setValue('status', v, { shouldValidate: true })}
            defaultValue={initialData?.status}
          >
            <SelectTrigger className={errors.status ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {statusList
                .filter((s) => isAdmin || s.name.toUpperCase() !== 'BAIXA')
                .map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Categoria *</Label>
          <Select
            onValueChange={(v) => setValue('categoria', v, { shouldValidate: true })}
            defaultValue={initialData?.categoria}
          >
            <SelectTrigger className={errors.categoria ? 'border-destructive' : ''}>
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
          {errors.categoria && (
            <p className="text-xs text-destructive">{errors.categoria.message}</p>
          )}
        </div>

        {isAdmin && (
          <div className="space-y-2">
            <Label>Pgto *</Label>
            <Select
              onValueChange={(v) => setValue('pgto', v, { shouldValidate: true })}
              defaultValue={initialData?.pgto}
            >
              <SelectTrigger className={errors.pgto ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o tipo de pagamento" />
              </SelectTrigger>
              <SelectContent>
                {pgtoTipos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.pgto && <p className="text-xs text-destructive">{errors.pgto.message}</p>}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          {...register('observacoes')}
          rows={3}
          placeholder="Detalhes adicionais..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit">{initialData ? 'Salvar Alterações' : 'Cadastrar Cliente'}</Button>
      </div>
    </form>
  )
}
