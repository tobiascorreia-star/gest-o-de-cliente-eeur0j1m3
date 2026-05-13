import { Outlet } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './layout/app-sidebar'
import { AppHeader } from './layout/app-header'
import { APP_VERSION } from '@/constants/version'

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 relative">
          <AppHeader />
          <main className="flex-1 overflow-auto flex flex-col bg-transparent">
            <div className="flex-1 p-4 md:p-8 pb-12 relative">
              <div className="max-w-7xl mx-auto w-full h-full animate-fade-in-up">
                <Outlet />
              </div>
            </div>
            <footer className="w-full py-4 text-center text-xs text-muted-foreground mt-auto font-medium">
              © 2026 - MegaFllex Soluções • Versão {APP_VERSION}
            </footer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
