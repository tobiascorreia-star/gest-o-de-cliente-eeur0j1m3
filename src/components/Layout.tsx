import { Outlet } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './layout/app-sidebar'
import { AppHeader } from './layout/app-header'

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 z-10">
          <AppHeader />
          <main className="flex-1 overflow-auto flex flex-col bg-white/40 backdrop-blur-sm dark:bg-background/95">
            <div className="flex-1 p-4 md:p-6 pb-12 relative">
              {/* Subtle decorative elements for the background */}
              <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-100/30 to-transparent pointer-events-none -z-10" />
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
