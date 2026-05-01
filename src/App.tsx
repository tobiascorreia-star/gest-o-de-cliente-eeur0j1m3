import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/contexts/app-context'
import Layout from './components/Layout'
import Index from './pages/Index'
import Clientes from './pages/Clientes'
import Historico from './pages/Historico'
import Auditoria from './pages/Auditoria'
import Usuarios from './pages/Usuarios'
import Concluidos from './pages/Concluidos'
import Relatorio from './pages/Relatorio'
import Configuracao from './pages/Configuracao'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/auditoria" element={<Auditoria />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/concluidos" element={<Concluidos />} />
            <Route path="/relatorio" element={<Relatorio />} />
            <Route path="/configuracao" element={<Configuracao />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
