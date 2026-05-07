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

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

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
    <div className="max-w-6xl">
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
            <AccordionContent className="px-6 pt-4 pb-6 bg-slate-50/30 dark:bg-slate-900/30">
              <Accordion type="multiple" className="w-full space-y-3">
                {years[year].map((m) => (
                  <AccordionItem
                    key={`${m.ano}-${m.mes}`}
                    value={`month-${m.ano}-${m.mes}`}
                    className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 overflow-hidden shadow-sm"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50/50 dark:hover:bg-slate-900/50 font-semibold text-slate-700 dark:text-slate-200">
                      {MONTH_NAMES[m.mes - 1]} / {m.ano}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 py-4 bg-slate-50 dark:bg-slate-900/50">
                      <div className="max-w-sm h-[500px] bg-transparent">
                        <MonthGroup
                          mes={m.mes}
                          ano={m.ano}
                          items={m.items}
                          onEditItem={onEditItem}
                          onAddForOwner={onAddForOwner}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
