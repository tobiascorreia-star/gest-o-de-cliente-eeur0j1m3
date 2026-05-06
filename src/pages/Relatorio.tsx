import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon, Printer } from 'lucide-react'
import { format, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { ClienteList } from '@/components/clientes/cliente-list'
import { getClients } from '@/services/clients'
import { getConfigurations } from '@/services/configurations'
import { useRealtime } from '@/hooks/use-realtime'
import { Client } from '@/types'
import { cn } from '@/lib/utils'

const Relatorio = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [configs, setConfigs] = useState<any[]>([])
  const [configsLoaded, setConfigsLoaded] = useState(false)
  const [dateStart, setDateStart] = useState<Date>()
  const [dateEnd, setDateEnd] = useState<Date>()
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  const loadConfigs = async () => {
    try {
      const configsData = await getConfigurations()
      setConfigs(configsData)
    } catch (error) {
      console.error(error)
    } finally {
      setConfigsLoaded(true)
    }
  }

  useEffect(() => {
    loadConfigs()
  }, [])

  const baixaStatusId = useMemo(() => {
    return configs.find(
      (c: any) => c.type?.toLowerCase() === 'status' && c.name?.toLowerCase() === 'baixa',
    )?.id
  }, [configs])

  const loadData = useCallback(async () => {
    if (!configsLoaded) return

    setIsLoading(true)
    try {
      const filters: string[] = []

      if (statusFilter === 'active' && baixaStatusId) {
        filters.push(`status != '${baixaStatusId}'`)
      } else if (statusFilter === 'completed' && baixaStatusId) {
        filters.push(`status = '${baixaStatusId}'`)
      }

      if (dateStart) {
        filters.push(`created >= '${startOfDay(dateStart).toISOString().replace('T', ' ')}'`)
      }
      if (dateEnd) {
        filters.push(`created <= '${endOfDay(dateEnd).toISOString().replace('T', ' ')}'`)
      }

      const filter = filters.join(' && ')
      const clientsData = await getClients({ filter })
      setClients(clientsData)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, dateStart, dateEnd, baixaStatusId, configsLoaded])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('clients', loadData)
  useRealtime('configurations', loadConfigs)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h2 className="text-2xl font-bold tracking-tight">Relatórios</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Gere extratos detalhados e visualize relatórios impressos.
        </p>
      </div>

      <Card className="max-w-4xl border-border/50 shadow-sm rounded-xl print:hidden">
        <CardHeader>
          <CardTitle>Filtros do Relatório</CardTitle>
          <CardDescription>
            Selecione os parâmetros para visualizar a listagem em PDF.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal rounded-lg',
                      !dateStart && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateStart ? format(dateStart, 'P', { locale: ptBR }) : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateStart} onSelect={setDateStart} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal rounded-lg',
                      !dateEnd && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateEnd ? format(dateEnd, 'P', { locale: ptBR }) : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateEnd} onSelect={setDateEnd} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Filtrar Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Todos os Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Apenas Ativos</SelectItem>
                  <SelectItem value="completed">Apenas Concluídos (Baixa)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-border/50">
            <Button
              onClick={handlePrint}
              className="w-full sm:w-auto rounded-lg"
              disabled={isLoading}
            >
              <Printer className="w-4 h-4 mr-2" /> Visualizar para PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* This container will be the only visible part during print */}
      <div id="printable-report" className="hidden print:block space-y-4">
        <div className="text-center mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold">GESTÃO Cliente - Relatório</h1>
          <p className="text-gray-600 mt-2">
            Período: {dateStart ? format(dateStart, 'dd/MM/yyyy') : 'Início'} até{' '}
            {dateEnd ? format(dateEnd, 'dd/MM/yyyy') : 'Hoje'} | Status:{' '}
            {statusFilter === 'active'
              ? 'Ativos'
              : statusFilter === 'completed'
                ? 'Concluídos'
                : 'Todos'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}
          </p>
        </div>
        {clients.length === 0 ? (
          <p className="text-center text-gray-500 my-8">
            Nenhum registro encontrado para os filtros selecionados.
          </p>
        ) : (
          <ClienteList
            clients={clients}
            onEdit={() => {}}
            onDelete={() => {}}
            onBaixa={() => {}}
            isRestrictedArea={true}
          />
        )}
      </div>

      <div className="print:hidden pt-4">
        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">
          Pré-visualização dos Dados ({clients.length} registros)
        </h3>
        {isLoading && clients.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">Carregando dados...</div>
        ) : clients.length === 0 ? (
          <div className="py-8 text-center border rounded-lg bg-muted/20 text-muted-foreground">
            Nenhum registro encontrado para os filtros selecionados.
          </div>
        ) : (
          <ClienteList
            clients={clients}
            onEdit={() => {}}
            onDelete={() => {}}
            onBaixa={() => {}}
            isRestrictedArea={true}
          />
        )}
      </div>
    </div>
  )
}

export default Relatorio
