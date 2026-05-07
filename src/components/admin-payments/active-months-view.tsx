import { AdminPayment } from '@/types'
import { MonthGroup } from './month-group'

interface Props {
  months: { mes: number; ano: number; items: AdminPayment[] }[]
  onEditItem: (item: AdminPayment) => void
  onAddForOwner: (mes: number, ano: number, owner: string) => void
}

export function ActiveMonthsView({ months, onEditItem, onAddForOwner }: Props) {
  if (months.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-muted-foreground">Nenhum mês ativo no momento.</p>
        <p className="text-sm text-muted-foreground mt-1">Crie um novo pagamento para começar.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4 snap-x pr-8 scrollbar-thin w-full scroll-smooth">
      {months.map((m) => (
        <div
          key={`${m.ano}-${m.mes}`}
          className="w-[300px] shrink-0 snap-start flex flex-col min-h-0"
        >
          <MonthGroup
            mes={m.mes}
            ano={m.ano}
            items={m.items}
            onEditItem={onEditItem}
            onAddForOwner={onAddForOwner}
          />
        </div>
      ))}
    </div>
  )
}
