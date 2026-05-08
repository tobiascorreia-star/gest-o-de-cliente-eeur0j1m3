import { useContext } from 'react'
import { AdminPayment } from '@/types'
import { MonthGroup } from './month-group'
import { AdminPaymentsFilterContext } from '@/pages/PagamentosAdmin'

interface Props {
  months: { mes: number; ano: number; items: AdminPayment[] }[]
  onEditItem: (item: AdminPayment) => void
  onAddForOwner: (mes: number, ano: number, owner: string) => void
}

export function ActiveMonthsView({ months, onEditItem, onAddForOwner }: Props) {
  const { search, status, todayOnly } = useContext(AdminPaymentsFilterContext)

  if (months.length === 0) {
    if (todayOnly) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-muted-foreground font-medium">Nenhum pagamento para hoje</p>
          <p className="text-sm text-muted-foreground mt-1">
            Você não possui pagamentos com data de notificação para o dia de hoje.
          </p>
        </div>
      )
    }

    if (search || status !== 'all') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-muted-foreground font-medium">Nenhum resultado encontrado.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Não foram encontrados pagamentos ativos para os filtros aplicados.
          </p>
        </div>
      )
    }
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
