import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useApp } from '@/contexts/app-context'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function DashboardCharts() {
  const { clients, solicitacoes } = useApp()

  const lineData = useMemo(() => {
    const data = []
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i)
      const monthStr = format(d, 'MMM', { locale: ptBR })
      // mock counting
      const count =
        clients.filter((c) => new Date(c.dataCadastro) <= d).length + Math.floor(Math.random() * 10)
      data.push({ month: monthStr, clientes: count })
    }
    return data
  }, [clients])

  const barData = useMemo(() => {
    return solicitacoes.map((sol) => {
      const count = clients.filter((c) => c.solicitacaoId === sol.id).length
      return { category: sol.name, total: count }
    })
  }, [clients, solicitacoes])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
      <Card className="lg:col-span-4 border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">Crescimento da Base</CardTitle>
        </CardHeader>
        <CardContent className="pl-0">
          <ChartContainer
            config={{ clientes: { label: 'Clientes', color: 'hsl(var(--primary))' } }}
            className="h-[300px] w-full"
          >
            <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={12}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="clientes"
                stroke="var(--color-clientes)"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3 border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">Solicitações por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="pl-0">
          <ChartContainer
            config={{ total: { label: 'Total', color: 'hsl(var(--chart-2))' } }}
            className="h-[300px] w-full"
          >
            <BarChart
              data={barData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={12}
              />
              <YAxis
                dataKey="category"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={12}
                width={120}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
