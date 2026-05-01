import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider, useApp } from '@/contexts/app-context'
import Layout from './components/Layout'
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

const ProtectedRoute = () => {
  const { currentUser } = useApp()
  if (!currentUser) return <Navigate to="/login" replace />
  return <Outlet />
}

const AdminRoute = () => {
  const { currentUser } = useApp()
  if (currentUser?.role !== 'Admin') return <Navigate to="/" replace />
  return <Outlet />
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/auditoria" element={<Auditoria />} />
          <Route path="/concluidos" element={<Concluidos />} />
          <Route path="/arquivo" element={<Arquivo />} />
          <Route path="/relatorio" element={<Relatorio />} />

          <Route element={<AdminRoute />}>
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
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </AppProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
