import { Outlet } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './layout/app-sidebar'
import { AppHeader } from './layout/app-header'
import { APP_VERSION } from '@/constants/version'

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 relative h-screen">
          <AppHeader />
          <main className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto p-4 md:p-6 pb-10 scrollbar-thin flex flex-col">
              <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col animate-fade-in-up">
                <Outlet />
              </div>
            </div>
            <footer className="shrink-0 w-full py-2 border-t border-border/50 text-center text-[11px] text-muted-foreground font-medium bg-background/80 backdrop-blur-sm">
              © 2026 MegaFllex Soluções &nbsp;·&nbsp; {APP_VERSION}
            </footer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
