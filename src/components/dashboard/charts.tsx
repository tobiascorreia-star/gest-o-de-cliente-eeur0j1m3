import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useDashboard } from '@/hooks/use-dashboard'
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import { format, startOfMonth, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function DashboardCharts() {
  const { clients, categories } = useDashboard()

  const lineData = useMemo(() => {
    const today = new Date()
    const start = startOfMonth(today)

    if (start > today) {
      return []
    }

    const countsPerDay: Record<string, number> = {}
    clients.forEach((c) => {
      const catObj = Array.isArray(c.expand?.categoria)
        ? c.expand.categoria[0]
        : c.expand?.categoria
      const isNovo = catObj?.name?.toLowerCase() === 'novo'
      const created = new Date(c.created)

      if (isNovo && created >= start) {
        const dayStr = format(created, 'dd/MM')
        countsPerDay[dayStr] = (countsPerDay[dayStr] || 0) + 1
      }
    })

    const days = eachDayOfInterval({ start, end: today })
    let cumulative = 0

    return days.map((d) => {
      const dayStr = format(d, 'dd/MM')
      cumulative += countsPerDay[dayStr] || 0
      return { period: dayStr, clientes: cumulative }
    })
  }, [clients])

  const barData = useMemo(() => {
    const counts: Record<string, { total: number; fill: string }> = {}

    clients.forEach((c) => {
      const catObj = Array.isArray(c.expand?.categoria)
        ? c.expand.categoria[0]
        : c.expand?.categoria

      if (catObj && catObj.name) {
        const catName = catObj.name
        if (!counts[catName]) {
          const catConfig = categories.find((cat) => cat.id === catObj.id)
          counts[catName] = {
            total: 0,
            fill: catConfig?.color || catObj.color || 'hsl(var(--primary))',
          }
        }
        counts[catName].total += 1
      }
    })

    const data = Object.entries(counts).map(([category, { total, fill }]) => ({
      category,
      total,
      fill,
    }))

    return data.sort((a, b) => b.total - a.total)
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
                dataKey="period"
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
