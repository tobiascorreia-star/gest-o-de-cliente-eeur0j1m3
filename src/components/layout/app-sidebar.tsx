import { Link, useLocation } from 'react-router-dom'
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
  Building2,
  LogOut,
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

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Histórico', href: '/historico', icon: History },
  { name: 'Auditoria', href: '/auditoria', icon: ShieldAlert, adminOnly: true },
  { name: 'Usuários', href: '/usuarios', icon: UserCog, adminOnly: true },
  { name: 'Concluídos do Mês', href: '/concluidos', icon: CheckSquare },
  { name: 'Arquivo', href: '/arquivo', icon: Archive },
  { name: 'Relatório', href: '/relatorio', icon: FileBarChart },
  { name: 'Configuração', href: '/configuracao', icon: Settings, adminOnly: true },
]

export function AppSidebar() {
  const location = useLocation()
  const isMobile = useIsMobile()
  const { setOpenMobile } = useSidebar()
  const { user, signOut } = useAuth()

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
          <div className="bg-primary/10 text-primary p-1.5 rounded-lg shrink-0">
            <Building2 className="w-4 h-4" />
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
                      <Link to={item.href}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.name}</span>
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
          <span className="text-[10px] text-sidebar-foreground/40 font-mono tracking-widest">
            v0.0.60 (Inspetor)
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
