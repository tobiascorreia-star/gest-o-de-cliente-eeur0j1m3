import { Bell, Search } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useLocation } from 'react-router-dom'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useApp } from '@/contexts/app-context'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { differenceInDays } from 'date-fns'

const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/clientes': 'Clientes',
  '/historico': 'Histórico',
  '/auditoria': 'Auditoria',
  '/usuarios': 'Usuários',
  '/concluidos': 'Concluídos do Mês',
  '/arquivo': 'Arquivo',
  '/relatorio': 'Relatório',
  '/configuracao': 'Configuração',
}

export function AppHeader() {
  const location = useLocation()
  const title = routeNames[location.pathname] || 'Gestão de Cliente'
  const { clients, statusList, alertConfig } = useApp()
  const { user } = useAuth()

  const baixaStatusId = statusList.find((s) => s.name === 'Baixa')?.id

  const activeAlerts = clients
    .filter((c) => {
      if (c.statusId === baixaStatusId) return false
      const days = differenceInDays(new Date(), new Date(c.dataCadastro))
      return days >= alertConfig.moderateDays
    })
    .sort((a, b) => {
      const daysA = differenceInDays(new Date(), new Date(a.dataCadastro))
      const daysB = differenceInDays(new Date(), new Date(b.dataCadastro))
      return daysB - daysA
    })

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <h1 className="font-semibold text-lg hidden md:block animate-fade-in">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar global..."
            className="pl-9 bg-muted/50 border-transparent focus-visible:border-primary h-9 rounded-full"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {activeAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="p-3 border-b border-border/50">
              <h4 className="font-semibold text-sm">Notificações</h4>
            </div>
            <div className="max-h-64 overflow-auto p-2">
              {activeAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum alerta pendente.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {activeAlerts.slice(0, 5).map((alert) => {
                    const days = differenceInDays(new Date(), new Date(alert.dataCadastro))
                    let severityLabel = 'Moderado'
                    let severityClass = 'text-amber-500'

                    if (days >= alertConfig.veryCriticalDays) {
                      severityLabel = 'Crítica Absoluta'
                      severityClass = 'text-purple-600'
                    } else if (days >= alertConfig.oldDays) {
                      severityLabel = 'Antiguidade'
                      severityClass = 'text-slate-500'
                    } else if (days >= alertConfig.criticalDays) {
                      severityLabel = 'Crítico'
                      severityClass = 'text-destructive'
                    }

                    return (
                      <div
                        key={alert.id}
                        className="text-sm p-2 rounded-md hover:bg-muted transition-colors cursor-default"
                      >
                        <p className="font-medium text-foreground truncate">{alert.razaoSocial}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex justify-between items-center pr-2">
                          <span>Pendente há {days} dias</span>
                          <span className={`font-medium ${severityClass}`}>{severityLabel}</span>
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Avatar className="w-8 h-8 ring-2 ring-background cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarImage
            src={
              user?.avatar
                ? pb.files.getURL(user, user.avatar)
                : `https://img.usecurling.com/ppl/thumbnail?seed=${user?.id}`
            }
          />
          <AvatarFallback>{user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
