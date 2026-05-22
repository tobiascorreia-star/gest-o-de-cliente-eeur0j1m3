import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/contexts/app-context'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { ThemeProvider } from '@/components/theme-provider'
import Layout from './components/Layout'
import { useEffect } from 'react'

function MobileTypographyFix() {
  useEffect(() => {
    const applyFix = () => {
      if (window.innerWidth >= 768) return

      // Encontra elementos que contêm o título do Card 1
      const allElements = document.querySelectorAll('*')
      allElements.forEach((el) => {
        if (el.textContent?.trim().toUpperCase() === 'TOTAL A RECEBER') {
          // Sobe na árvore para encontrar o container do card
          let card = el.parentElement
          while (
            card &&
            !card.className.includes('bg-') &&
            !card.className.includes('card') &&
            !card.className.includes('rounded')
          ) {
            card = card.parentElement
          }

          if (card) {
            // Encontra o elemento com o valor monetário dentro deste card específico
            const children = card.querySelectorAll('*')
            children.forEach((child) => {
              if (child.textContent?.includes('R$') && child.classList) {
                const classes = Array.from(child.classList)
                const hasLargeText = classes.some((c) =>
                  c.match(/text-(5xl|6xl|7xl|8xl|9xl|\[.*?\])/),
                )

                if (hasLargeText) {
                  // Substitui classes muito grandes por um tamanho mobile balanceado (e.g., text-4xl)
                  child.className = child.className.replace(
                    /text-(5xl|6xl|7xl|8xl|9xl|\[.*?\])/g,
                    '',
                  )
                  child.classList.add('text-4xl', 'md:text-5xl', 'font-extrabold')

                  // Previne a quebra de linha indesejada (ex: quebrar no meio dos centavos)
                  const htmlEl = child as HTMLElement
                  htmlEl.style.whiteSpace = 'nowrap'
                  htmlEl.style.overflow = 'hidden'
                  htmlEl.style.textOverflow = 'ellipsis'
                }
              }
            })
          }
        }
      })
    }

    applyFix()
    window.addEventListener('resize', applyFix)

    // Observa mudanças dinâmicas na página
    const observer = new MutationObserver((mutations) => {
      let shouldRun = false
      for (const m of mutations) {
        if (m.addedNodes.length > 0 || m.type === 'characterData') {
          shouldRun = true
          break
        }
      }
      if (shouldRun) applyFix()
    })

    observer.observe(document.body, { childList: true, subtree: true, characterData: true })

    return () => {
      window.removeEventListener('resize', applyFix)
      observer.disconnect()
    }
  }, [])
  return null
}
import { ErrorBoundary } from './components/error-boundary'
import Index from './pages/Index'
import Clientes from './pages/Clientes'
import Historico from './pages/Historico'
import Auditoria from './pages/Auditoria'
import Usuarios from './pages/Usuarios'
import FolhaPagamento from './pages/FolhaPagamento'
import Concluidos from './pages/Concluidos'
import Arquivo from './pages/Arquivo'
import Relatorio from './pages/Relatorio'
import Configuracao from './pages/Configuracao'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Setup from './pages/Setup'
import PagamentosAdmin from './pages/PagamentosAdmin'
import SaudeFinanceira from './pages/SaudeFinanceira'
import EducacaoFinanceiraAdmin from './pages/EducacaoFinanceiraAdmin'
import { UpdateNotification } from './components/update-notification'
import { AdminPaymentsAlert } from './components/admin-payments-alert'

const ProtectedRoute = () => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.setup_completed === false) return <Navigate to="/setup" replace />
  return <Outlet />
}

const SetupRoute = () => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.setup_completed !== false) return <Navigate to="/" replace />
  return <Outlet />
}

const AdminRoute = () => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user?.role?.toLowerCase() !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<SetupRoute />}>
        <Route path="/setup" element={<Setup />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/concluidos" element={<Concluidos />} />
          <Route path="/relatorio" element={<Relatorio />} />
          <Route path="/saude-financeira" element={<SaudeFinanceira />} />
          <Route element={<AdminRoute />}>
            <Route path="/arquivo" element={<Arquivo />} />
            <Route path="/auditoria" element={<Auditoria />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/folha-pagamento" element={<FolhaPagamento />} />
            <Route path="/pagamentos-admin" element={<PagamentosAdmin />} />
            <Route path="/educacao-financeira-admin" element={<EducacaoFinanceiraAdmin />} />
            <Route path="/configuracao" element={<Configuracao />} />
          </Route>{' '}
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <TooltipProvider>
          <AuthProvider>
            <AppProvider>
              <Toaster />
              <Sonner />
              <MobileTypographyFix />
              <AppRoutes />
              <UpdateNotification />
              <AdminPaymentsAlert />
            </AppProvider>
          </AuthProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </ThemeProvider>
)

export default App
