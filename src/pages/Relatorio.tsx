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
import { format, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState } from 'react'
import { useApp } from '@/contexts/app-context'
import { ClienteList } from '@/components/clientes/cliente-list'

const Relatorio = () => {
  const { clients, statusList } = useApp()
  const [dateStart, setDateStart] = useState<Date>()
  const [dateEnd, setDateEnd] = useState<Date>()
  const [statusFilter, setStatusFilter] = useState('all')

  const baixaStatusId = statusList.find((s) => s.name === 'Baixa')?.id

  const handlePrint = () => {
    window.print()
  }

  const filteredClients = clients.filter((c) => {
    let matchesStatus = true
    if (statusFilter === 'active') matchesStatus = c.statusId !== baixaStatusId
    if (statusFilter === 'completed') matchesStatus = c.statusId === baixaStatusId

    let matchesDate = true
    if (dateStart && dateEnd) {
      const cDate = new Date(c.dataCadastro)
      matchesDate = isWithinInterval(cDate, { start: dateStart, end: dateEnd })
    } else if (dateStart) {
      matchesDate = new Date(c.dataCadastro) >= dateStart
    } else if (dateEnd) {
      matchesDate = new Date(c.dataCadastro) <= dateEnd
    }

    return matchesStatus && matchesDate
  })

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
                    className="w-full justify-start text-left font-normal rounded-lg"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateStart ? (
                      format(dateStart, 'P', { locale: ptBR })
                    ) : (
                      <span className="text-muted-foreground">Selecione</span>
                    )}
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
                    className="w-full justify-start text-left font-normal rounded-lg"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateEnd ? (
                      format(dateEnd, 'P', { locale: ptBR })
                    ) : (
                      <span className="text-muted-foreground">Selecione</span>
                    )}
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
            <Button onClick={handlePrint} className="w-full sm:w-auto rounded-lg">
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
        <ClienteList
          clients={filteredClients}
          onEdit={() => {}}
          onDelete={() => {}}
          onBaixa={() => {}}
          isRestrictedArea={true}
        />
      </div>

      <div className="print:hidden pt-4">
        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">
          Pré-visualização dos Dados ({filteredClients.length} registros)
        </h3>
        <ClienteList
          clients={filteredClients}
          onEdit={() => {}}
          onDelete={() => {}}
          onBaixa={() => {}}
          isRestrictedArea={true}
        />
      </div>
    </div>
  )
}

export default Relatorio
