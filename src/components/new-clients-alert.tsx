import { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Bell, X } from 'lucide-react'

export function NewClientsAlert() {
  const { user } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const checkNew = useCallback(async () => {
    if (!user?.id || location.pathname === '/clientes') return

    const checkDate = user.last_clients_check || user.created
    if (!checkDate) return

    try {
      const res = await pb.collection('clients').getList(1, 1, {
        filter: `created > "${checkDate}"`,
        requestKey: null,
      })
      if (res.totalItems > 0) {
        setOpen(true)
      }
    } catch (e) {
      console.error('Failed to check new clients', e)
    }
  }, [user?.id, user?.last_clients_check, user?.created, location.pathname])

  useEffect(() => {
    if (location.pathname === '/clientes') {
      setOpen(false)
    } else {
      checkNew()
    }
  }, [location.pathname, checkNew])

  useRealtime(
    'clients',
    () => {
      if (location.pathname !== '/clientes') {
        checkNew()
      }
    },
    location.pathname !== '/clientes',
  )

  const handleClose = async () => {
    setOpen(false)
    if (user?.id) {
      try {
        await pb.collection('users').update(user.id, {
          last_clients_check: new Date().toISOString(),
        })
      } catch (e) {
        console.error('Failed to update last check', e)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="bg-[#0b1121] border-[#1e293b] text-white sm:max-w-[425px] p-8 shadow-2xl rounded-2xl [&>button]:hidden">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full border border-slate-700 bg-slate-900/50 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Fechar</span>
        </button>
        <div className="flex flex-col items-center justify-center gap-4 text-center mt-2">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-400 shrink-0" />
            <DialogTitle className="text-xl font-bold tracking-tight text-white m-0">
              Novos Clientes Cadastrados
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-300 text-[15px] leading-relaxed mt-1">
            Você possui novos clientes cadastrados no sistema desde o seu último acesso. Verifique o
            módulo de clientes para mais detalhes.
          </DialogDescription>
        </div>
      </DialogContent>
    </Dialog>
  )
}
