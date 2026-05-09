import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Client } from '@/types'
import { useAuth } from '@/hooks/use-auth'
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
import { format } from 'date-fns'

const formSchema = z.object({
  cnpj: z.string().min(18, 'CNPJ incompleto').max(18, 'CNPJ incompleto'),
  razao_social: z.string().min(3, 'Razão social é obrigatória'),
  nome_cliente: z.string().min(3, 'Cliente é obrigatório'),
  colaborador: z.string().optional(),
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
  onCancel?: () => void
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

export function ClienteForm({ initialData, onSuccess, onCancel }: ClienteFormProps) {
  const { user } = useAuth()
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false)
  const [configs, setConfigs] = useState<any[]>([])
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(true)
  const [configsError, setConfigsError] = useState<string | null>(null)
  const isAdmin = user?.role?.toLowerCase() === 'admin'

  const fetchConfigs = async () => {
    try {
      setIsLoadingConfigs(true)
      setConfigsError(null)
      const data = await getConfigurations()
      setConfigs(data)
    } catch (error: any) {
      console.error(error)
      setConfigsError(
        'Não foi possível carregar as configurações do sistema. Tente novamente mais tarde.',
      )
      toast({
        title: 'Erro de Conexão',
        description: 'Falha ao carregar as listas de seleção.',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingConfigs(false)
    }
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  useRealtime('configurations', () => {
    fetchConfigs()
  })

  const colaboradores = configs.filter((c) => c.type === 'Colaborador' && c.active !== false)
  const solicitacoes = configs.filter((c) => c.type === 'Solicitação' && c.active !== false)
  const statusList = configs.filter((c) => c.type === 'Status' && c.active !== false)
  const categorias = configs.filter((c) => c.type === 'Categoria' && c.active !== false)
  const pgtoTipos = configs.filter((c) => c.type === 'Pgto' && c.active !== false)

  const userFirstName = user?.name?.split(' ')[0] || ''

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
          colaborador: isAdmin ? initialData.colaborador : userFirstName,
        }
      : {
          cnpj: '',
          razao_social: '',
          nome_cliente: '',
          colaborador: isAdmin ? '' : userFirstName,
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

  useEffect(() => {
    if (!isAdmin && userFirstName) {
      setValue('colaborador', userFirstName, { shouldValidate: true })
    }
  }, [isAdmin, userFirstName, setValue])

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

  if (isLoadingConfigs) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p>Carregando formulário...</p>
      </div>
    )
  }

  if (configsError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-destructive text-center">
        <p className="mb-4 font-medium">{configsError}</p>
        <Button onClick={fetchConfigs} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    )
  }

  const onSubmit = async (data: FormData) => {
    const baixaStatus = statusList.find((s) => s.name.toUpperCase() === 'BAIXA')
    const isBaixa = baixaStatus && data.status === baixaStatus.id

    let colaboradorId = data.colaborador || ''
    if (!isAdmin) {
      if (userFirstName) {
        const match = colaboradores.find(
          (c) => c.name.toLowerCase() === userFirstName.toLowerCase(),
        )
        if (match) {
          colaboradorId = match.id
        } else {
          try {
            const { default: pb } = await import('@/lib/pocketbase/client')
            const newConf = await pb.collection('configurations').create({
              type: 'Colaborador',
              name: userFirstName,
              active: true,
            })
            colaboradorId = newConf.id
          } catch (error: any) {
            toast({
              title: 'Erro',
              description: 'Falha ao processar colaborador',
              variant: 'destructive',
            })
            return
          }
        }
      }
    }

    const clientData = {
      ...data,
      colaborador: colaboradorId,
      last_modified_by: user?.id,
      pgto: data.pgto || '',
      ...(initialData ? {} : { observacao_lida: false, data_leitura_observacao: '' }),
      ...(isBaixa && (!initialData || initialData.status !== baixaStatus.id)
        ? { data_baixa: new Date().toISOString() }
        : {}),
      ...(!isBaixa && initialData && initialData.status === baixaStatus?.id
        ? { data_baixa: '' }
        : {}),
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
          <Label htmlFor="colaborador_responsavel">Colaborador Responsável *</Label>
          {isAdmin ? (
            <Select
              onValueChange={(v) => setValue('colaborador', v, { shouldValidate: true })}
              defaultValue={initialData?.colaborador}
            >
              <SelectTrigger className={errors.colaborador ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione um colaborador" />
              </SelectTrigger>
              <SelectContent>
                {colaboradores.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="colaborador_responsavel"
              value={userFirstName}
              readOnly
              className="bg-[#f5f5f5] focus-visible:ring-0 cursor-not-allowed"
            />
          )}
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

        <div className={isAdmin ? 'space-y-2' : 'space-y-2 md:col-span-2'}>
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
            <Label>Pgto</Label>
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

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4">
        {initialData?.expand?.last_modified_by ? (
          <div className="text-xs text-muted-foreground">
            Última modificação por:{' '}
            <span className="font-medium text-foreground">
              {initialData.expand.last_modified_by.name}
            </span>{' '}
            em{' '}
            <span className="font-medium text-foreground">
              {format(new Date(initialData.updated), 'dd/MM/yyyy HH:mm')}
            </span>
          </div>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => onCancel?.()}>
            Cancelar
          </Button>
          <Button type="submit">{initialData ? 'Salvar Alterações' : 'Cadastrar Cliente'}</Button>
        </div>
      </div>
    </form>
  )
}
