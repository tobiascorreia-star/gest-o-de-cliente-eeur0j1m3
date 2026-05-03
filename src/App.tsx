import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/contexts/app-context'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { ThemeProvider } from '@/components/theme-provider'
import Layout from './components/Layout'
import { ErrorBoundary } from './components/error-boundary'
import Index from './pages/Index'
import Clientes from './pages/Clientes'
import Historico from './pages/Historico'
import Auditoria from './pages/Auditoria'
import Usuarios from './pages/Usuarios'
import Concluidos from './pages/Concluidos'
import Arquivo from './pages/Arquivo'
import Relatorio from './pages/Relatorio'
import Configuracao from './pages/Configuracao'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Setup from './pages/Setup'

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
          <Route path="/arquivo" element={<Arquivo />} />
          <Route path="/relatorio" element={<Relatorio />} />

          <Route element={<AdminRoute />}>
            <Route path="/auditoria" element={<Auditoria />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/configuracao" element={<Configuracao />} />
          </Route>
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
              <AppRoutes />
            </AppProvider>
          </AuthProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </ThemeProvider>
)

export default App
