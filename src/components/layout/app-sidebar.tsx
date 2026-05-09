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
  CheckSquare,
  Archive,
  FileBarChart,
  Settings,
  LogOut,
  Banknote,
  Wallet,
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
import logoUrl from '@/assets/generatedimage_1777858728629-bed4a.png'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Histórico', href: '/historico', icon: History },
  { name: 'Auditoria', href: '/auditoria', icon: ShieldAlert, adminOnly: true },
  { name: 'Usuários', href: '/usuarios', icon: UserCog, adminOnly: true },
  { name: 'Folha de Pagamento', href: '/folha-pagamento', icon: Banknote, adminOnly: true },
  { name: 'Pag. Admin', href: '/pagamentos-admin', icon: Wallet, adminOnly: true },
  { name: 'Arquivo', href: '/arquivo', icon: Archive, adminOnly: true },
  { name: 'Relatório', href: '/relatorio', icon: FileBarChart },
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

        if (hasUnreadObs || isCritical) {
          count++
        }
      })
      setClientAlertsCount(count)
    } catch (err) {
      console.error('Error fetching client alerts:', err)
    }
  }

  const fetchPendingAdminPayments = async () => {
    if (user?.role?.toLowerCase() !== 'admin') return
    try {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')} 23:59:59.999Z`

      const res = await pb.collection('admin_payments').getFullList({
        filter: `status = false && data_notificacao != '' && data_notificacao <= "${tomorrowStr}"`,
      })

      let overdueCount = 0
      let tomorrowCount = 0

      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
      const tomorrowStart = new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate(),
      ).getTime()

      res.forEach((item: any) => {
        const notifDate = new Date(item.data_notificacao.split(' ')[0] + 'T00:00:00').getTime()
        if (notifDate <= todayStart) {
          overdueCount++
        } else if (notifDate === tomorrowStart) {
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

  useRealtime('admin_payments', () => {
    fetchPendingAdminPayments()
  })

  useRealtime('clients', () => {
    fetchClientAlerts()
  })

  useRealtime('alert_settings', () => {
    fetchClientAlerts()
  })

  const filteredNavigation = navigation.filter((item) => {
    if (item.adminOnly && user?.role?.toLowerCase() !== 'admin') return false
    return true
  })

  return (
    <Sidebar
      collapsible={isMobile ? 'offcanvas' : 'icon'}
      variant="sidebar"
      className="border-r border-slate-100 shadow-sm dark:border-slate-800"
    >
      <SidebarHeader className="border-b border-slate-100 h-14 flex items-center justify-center px-4 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800">
        <div className="flex items-center gap-2 w-full overflow-hidden">
          <div className="shrink-0 flex items-center justify-center">
            <img
              src={logoUrl}
              alt="Logo"
              className="w-7 h-7 object-contain rounded-lg shadow-sm border border-slate-200 dark:border-slate-700"
            />
          </div>
          <span className="font-medium tracking-wide text-sm truncate group-data-[collapsible=icon]:hidden text-sidebar-foreground">
            Gestão Cliente
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-sidebar-foreground/50">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                      onClick={() => isMobile && setOpenMobile(false)}
                      className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Link to={item.href} className="flex items-center w-full">
                        <item.icon className="w-4 h-4 mr-2" />
                        <span>{item.name}</span>
                        {item.name === 'Pag. Admin' && pendingAdminPaymentsCount > 0 && (
                          <span
                            className={cn(
                              'ml-auto flex items-center justify-center text-white text-[10px] font-bold w-5 h-5 rounded-full animate-pulse shadow-sm',
                              hasOverdueAdminPayments ? 'bg-red-500' : 'bg-yellow-500',
                            )}
                          >
                            {pendingAdminPaymentsCount > 99 ? '99+' : pendingAdminPaymentsCount}
                          </span>
                        )}
                        {item.name === 'Clientes' && clientAlertsCount > 0 && (
                          <span className="ml-auto flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold min-w-5 px-1 h-5 rounded-full shadow-sm">
                            {clientAlertsCount > 99 ? '99+' : clientAlertsCount}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-100 dark:border-slate-800 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              tooltip="Sair da Conta"
              className="hover:bg-destructive/10 hover:text-destructive text-slate-600 dark:text-slate-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair do Sistema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mt-2 text-center group-data-[collapsible=icon]:hidden">
          <span className="text-xs text-muted-foreground font-mono tracking-widest">
            {APP_VERSION}
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
