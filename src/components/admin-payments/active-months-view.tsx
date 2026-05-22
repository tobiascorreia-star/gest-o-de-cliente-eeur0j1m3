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
  const { search, status, dueDateFilter } = useContext(AdminPaymentsFilterContext)

  if (months.length === 0) {
    if (dueDateFilter === 'today' || dueDateFilter === 'tomorrow') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-muted-foreground font-medium">
            Nenhum pagamento encontrado para este filtro
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Você não possui pagamentos com data de notificação para o período selecionado.
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
    <div className="flex flex-col md:flex-row h-full gap-4 overflow-y-auto md:overflow-y-visible overflow-x-hidden md:overflow-x-auto pb-4 md:snap-x pr-0 md:pr-8 scrollbar-thin w-full scroll-smooth">
      {months.map((m) => (
        <div
          key={`${m.ano}-${m.mes}`}
          className="w-full md:w-[300px] shrink-0 md:snap-start flex flex-col min-h-0"
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
