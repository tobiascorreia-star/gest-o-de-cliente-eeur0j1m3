import { AdminPayment } from '@/types'
import { MonthGroup } from './month-group'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface Props {
  years: Record<number, { mes: number; ano: number; items: AdminPayment[] }[]>
  onEditItem: (item: AdminPayment) => void
  onAddForOwner: (mes: number, ano: number, owner: string) => void
}

export function HistoryYearsView({ years, onEditItem, onAddForOwner }: Props) {
  const sortedYears = Object.keys(years)
    .map(Number)
    .sort((a, b) => b - a)

  if (sortedYears.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground">O histórico está vazio.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Os meses aparecerão aqui quando todos os pagamentos forem concluídos.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <Accordion type="single" collapsible className="w-full space-y-4">
        {sortedYears.map((year) => (
          <AccordionItem
            key={year}
            value={`year-${year}`}
            className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 overflow-hidden shadow-sm"
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50/50 dark:hover:bg-slate-900/50 text-lg font-bold">
              ANO {year}
            </AccordionTrigger>
            <AccordionContent className="px-6 pt-4 pb-2 bg-slate-50/30 dark:bg-slate-900/30">
              {years[year].map((m) => (
                <MonthGroup
                  key={`${m.ano}-${m.mes}`}
                  mes={m.mes}
                  ano={m.ano}
                  items={m.items}
                  onEditItem={onEditItem}
                  onAddForOwner={onAddForOwner}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
