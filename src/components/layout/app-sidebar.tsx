import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { differenceInCalendarDays } from 'date-fns'
import {
  LayoutDashboard,
  Users,
  History,
  ShieldAlert,
  UserCog,
  Archive,
  FileBarChart,
  Settings,
  LogOut,
  Banknote,
  Wallet,
  HeartHandshake,
  BookOpen,
  CircleDollarSign,
  FileSearch,
  ChevronRight,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile'
import { useSidebar } from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'
import { APP_VERSION } from '@/constants/version'
import logoUrl from '@/assets/logo-transparent-04707.png'
import { cn, isOverdueBusiness, isTodayBusiness, isTomorrowBusiness } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Histórico', href: '/historico', icon: History },
  { name: 'Auditoria', href: '/auditoria', icon: ShieldAlert, adminOnly: true },
  { name: 'Usuários', href: '/usuarios', icon: UserCog, adminOnly: true },
  { name: 'Folha de Pagamento', href: '/folha-pagamento', icon: Banknote, adminOnly: true },
  { name: 'Pag. Admin', href: '/pagamentos-admin', icon: Wallet, adminOnly: true },
  {
    name: 'Finanças Fácil',
    href: 'https://megafllexfinancas.com.br/',
    icon: CircleDollarSign,
    external: true,
  },
  {
    name: 'MegaFllex Auditoria',
    href: 'https://tobiascorreia-star.github.io/megafllex-auditoria/megafllex_auditoria.html',
    icon: FileSearch,
    external: true,
    requireAuditoria: true,
  },
  { name: 'Arquivo', href: '/arquivo', icon: Archive, adminOnly: true },
  { name: 'Relatório', href: '/relatorio', icon: FileBarChart },
  { name: 'Saúde Financeira', href: '/saude-financeira', icon: HeartHandshake },
  { name: 'Educ. Financeira', href: '/educacao-financeira-admin', icon: BookOpen, adminOnly: true },
  { name: 'Configuração', href: '/configuracao', icon: Settings, adminOnly: true },
]

export function AppSidebar() {
  const location = useLocation()
  const isMobile = useIsMobile()
  const { setOpenMobile } = useSidebar()
  const { user, signOut } = useAuth()

  const [pendingAdminPaymentsCount, setPendingAdminPaymentsCount] = useState(0)
  const [hasOverdueAdminPayments, setHasOverdueAdminPayments] = useState(false)
  const [clientAlertsCount, setClientAlertsCount] = useState(0)

  const fetchClientAlerts = async () => {
    if (!user) return
    try {
      const [clientsRes, settingsRes] = await Promise.all([
        pb.collection('clients').getFullList({ expand: 'status' }),
        pb.collection('alert_settings').getFullList(),
      ])
      const settings = settingsRes[0]

      let count = 0
      clientsRes.forEach((client: any) => {
        const hasUnreadObs = Boolean(client.observacoes && !client.observacao_lida)
        const statusName = client.expand?.status?.name?.toUpperCase() || ''
        const isPending =
          statusName !== 'BAIXA' && statusName !== 'CONCLUÍDO' && statusName !== 'CONCLUIDO'

        const days = client.created
          ? differenceInCalendarDays(new Date(), new Date(client.created))
          : 0
        const isCritical = settings && isPending && days >= settings.critical_days

        if (hasUnreadObs || isCritical) count++
      })
      setClientAlertsCount(count)
    } catch (err) {
      console.error('Error fetching client alerts:', err)
    }
  }

  const fetchPendingAdminPayments = async () => {
    if (user?.role?.toLowerCase() !== 'admin') return
    try {
      const res = await pb.collection('admin_payments').getFullList({
        filter: `status = false && data_notificacao != ''`,
      })

      let overdueCount = 0
      let tomorrowCount = 0

      res.forEach((item: any) => {
        const notifDateStr = item.data_notificacao.replace(' ', 'T')
        if (isOverdueBusiness(notifDateStr) || isTodayBusiness(notifDateStr)) {
          overdueCount++
        } else if (isTomorrowBusiness(notifDateStr)) {
          tomorrowCount++
        }
      })

      setPendingAdminPaymentsCount(overdueCount + tomorrowCount)
      setHasOverdueAdminPayments(overdueCount > 0)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchPendingAdminPayments()
    fetchClientAlerts()
  }, [user])

  useRealtime('admin_payments', () => { fetchPendingAdminPayments() })
  useRealtime('clients', () => { fetchClientAlerts() })
  useRealtime('alert_settings', () => { fetchClientAlerts() })

  const filteredNavigation = navigation.filter((item) => {
    const isAdmin = user?.role?.toLowerCase() === 'admin'
    if ((item as any).adminOnly && !isAdmin) return false
    if ((item as any).requireAuditoria && !isAdmin && user?.access_auditoria !== true) return false
    return true
  })

  const isActive = (href: string) => location.pathname === href

  return (
    <Sidebar
      collapsible={isMobile ? 'offcanvas' : 'icon'}
      variant="sidebar"
      className="border-r-0 shadow-2xl"
    >
      {/* Header */}
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 w-full overflow-hidden">
          <div className="shrink-0 relative">
            <div className="absolute inset-0 rounded-xl bg-cyan-500/20 blur-md" />
            <img
              src={logoUrl}
              alt="Logo"
              className="relative w-9 h-9 object-contain drop-shadow-lg"
            />
          </div>
          <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
            <span className="font-bold tracking-wide text-[15px] text-sidebar-foreground block leading-none">
              GestãoFllex
            </span>
            <span className="text-[10px] text-sidebar-foreground/40 font-mono tracking-widest uppercase">
              {APP_VERSION}
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-sidebar-foreground/30 text-[10px] uppercase tracking-widest font-semibold px-2 mb-1">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {filteredNavigation.map((item) => {
                const active = isActive(item.href)
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.name}
                      onClick={() => isMobile && setOpenMobile(false)}
                      className={cn(
                        'relative h-9 rounded-lg transition-all duration-150',
                        active
                          ? 'bg-sidebar-primary/15 text-sidebar-primary font-medium shadow-sm'
                          : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                      )}
                    >
                      {(item as any).external ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center w-full gap-2.5"
                        >
                          <item.icon className={cn('w-4 h-4 shrink-0', active && 'text-sidebar-primary')} />
                          <span className="text-[13px]">{item.name}</span>
                          <ChevronRight className="ml-auto w-3 h-3 opacity-30" />
                        </a>
                      ) : (
                        <Link to={item.href} className="flex items-center w-full gap-2.5">
                          <item.icon className={cn('w-4 h-4 shrink-0', active && 'text-sidebar-primary')} />
                          <span className="text-[13px]">{item.name}</span>
                          {item.name === 'Pag. Admin' && pendingAdminPaymentsCount > 0 && (
                            <span
                              className={cn(
                                'ml-auto flex items-center justify-center text-white text-[9px] font-bold min-w-[18px] h-[18px] px-1 rounded-full',
                                hasOverdueAdminPayments
                                  ? 'bg-orange-500 animate-pulse'
                                  : 'bg-amber-500',
                              )}
                            >
                              {pendingAdminPaymentsCount > 99 ? '99+' : pendingAdminPaymentsCount}
                            </span>
                          )}
                          {item.name === 'Clientes' && clientAlertsCount > 0 && (
                            <span className="ml-auto flex items-center justify-center bg-red-500 text-white text-[9px] font-bold min-w-[18px] h-[18px] px-1 rounded-full">
                              {clientAlertsCount > 99 ? '99+' : clientAlertsCount}
                            </span>
                          )}
                        </Link>
                      )}
                    </SidebarMenuButton>
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sidebar-primary rounded-r-full" />
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              tooltip="Sair da Conta"
              className="h-9 rounded-lg text-sidebar-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="text-[13px]">Sair do Sistema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
