import { useEffect, useState } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { Client } from '@/types'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export default function Historico() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchHistory = async (currentPage: number) => {
    try {
      setLoading(true)
      const data = await pb.collection('clients').getList<Client>(currentPage, 20, {
        filter: "status.name ~ 'Baixa' || data_baixa != ''",
        expand: 'colaborador,solicitacao,status,categoria,pgto',
        sort: '-data_baixa,-updated',
      })
      setClients(data.items)
      setTotalPages(data.totalPages > 0 ? data.totalPages : 1)
    } catch (error) {
      console.error('Error fetching history clients:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory(page)
  }, [page])

  useRealtime('clients', () => {
    fetchHistory(page)
  })

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="w-64 h-8 mb-2" />
            <Skeleton className="w-80 h-4" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="w-full h-24" />
          <Skeleton className="w-full h-24" />
          <Skeleton className="w-full h-24" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Histórico de Clientes</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Registro de clientes com status de baixa.
          </p>
        </div>
      </div>

      {clients.length === 0 ? (
        <Card className="border-border/50 bg-muted/20 shadow-sm">
          <CardContent className="p-12 text-center text-muted-foreground">
            Nenhum histórico encontrado nesta página.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-6 border-l-2 border-border/50 ml-3 pl-6 relative">
            {clients.map((client) => (
              <div key={client.id} className="relative group">
                <span className="absolute -left-[33px] flex items-center justify-center w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
                <div className="flex flex-col gap-2 p-4 rounded-lg border bg-card shadow-sm hover:border-border/80 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                    <h4 className="text-sm font-semibold text-foreground">{client.nome_cliente}</h4>
                    <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full w-fit">
                      {client.data_baixa
                        ? format(new Date(client.data_baixa), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : format(new Date(client.updated), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground/90 leading-relaxed grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <div>
                      <span className="font-semibold">CNPJ:</span> {client.cnpj}
                    </div>
                    <div>
                      <span className="font-semibold">Razão Social:</span> {client.razao_social}
                    </div>
                    <div>
                      <span className="font-semibold">Colaborador:</span>{' '}
                      {client.expand?.colaborador?.name || '-'}
                    </div>
                    <div>
                      <span className="font-semibold">Status:</span>{' '}
                      {client.expand?.status?.name || 'Baixa'}
                    </div>
                  </div>
                  {client.observacoes && (
                    <div className="text-sm text-muted-foreground mt-2 pt-2 border-t border-border/50">
                      <span className="font-semibold">Observações:</span> {client.observacoes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (page > 1) setPage((p) => p - 1)
                    }}
                    className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm text-muted-foreground px-4 py-2">
                    Página {page} de {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (page < totalPages) setPage((p) => p + 1)
                    }}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      )}
    </div>
  )
}
