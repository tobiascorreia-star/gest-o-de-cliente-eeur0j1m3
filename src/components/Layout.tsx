import { Outlet } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './layout/app-sidebar'
import { AppHeader } from './layout/app-header'

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <AppHeader />
          <main className="flex-1 overflow-auto flex flex-col bg-slate-50/50 dark:bg-background/95">
            <div className="flex-1 p-4 md:p-6 pb-12">
              <div className="max-w-7xl mx-auto w-full h-full animate-fade-in-up">
                <Outlet />
              </div>
            </div>
            <footer className="w-full py-4 text-center border-t border-border/50 bg-background/50 text-xs text-muted-foreground mt-auto">
              © 2026 - MegaFllex Soluções - Todos os direitos reservados
            </footer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
