import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useDashboard } from '@/hooks/use-dashboard'
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function DashboardCharts() {
  const { clients, categories } = useDashboard()

  const lineData = useMemo(() => {
    const data = []
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i)
      const monthStr = format(d, 'MMM', { locale: ptBR })
      const count = clients.filter((c) => new Date(c.created) <= d).length
      data.push({ month: monthStr, clientes: count })
    }
    return data
  }, [clients])

  const barData = useMemo(() => {
    const data = categories
      .filter((cat) => cat.active !== false)
      .map((cat) => {
        const count = clients.filter((c) => c.categoria === cat.id).length
        return { category: cat.name, total: count, fill: cat.color || 'hsl(var(--primary))' }
      })
    return data.length > 0 ? data : []
  }, [clients, categories])

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
          {barData.length === 0 ? (
            <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground text-sm">
              Nenhuma categoria ativa com dados encontrada.
            </div>
          ) : (
            <ChartContainer config={{ total: { label: 'Total' } }} className="h-[300px] w-full">
              <BarChart
                data={barData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                layout="vertical"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="hsl(var(--border))"
                />
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
                <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={24}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
