import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Bell, X, User as UserIcon, Info, ShieldAlert } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

type AlertType = 'profile' | 'system' | 'new-clients' | null

export function NewClientsAlert() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [activeAlert, setActiveAlert] = useState<AlertType>(null)
  const [latestClient, setLatestClient] = useState<any>(null)

  const dismissedAlerts = useRef<Set<string>>(new Set())
  const isChecking = useRef(false)

  const checkAlerts = useCallback(async () => {
    if (!user?.id || isChecking.current) return
    isChecking.current = true

    try {
      // 1. Profile Setup Alert (Photo/Avatar)
      const profileDismissed = localStorage.getItem(`dismissed_profile_${user.id}`) === 'true'
      if (!user.avatar && !profileDismissed && !dismissedAlerts.current.has('profile')) {
        setActiveAlert('profile')
        return
      }

      // 2. System Update Alert
      const systemDismissed =
        localStorage.getItem(`dismissed_system_v0.1.127_${user.id}`) === 'true'
      if (!systemDismissed && !dismissedAlerts.current.has('system')) {
        setActiveAlert('system')
        return
      }

      // 3. New Clients Alert
      if (location.pathname !== '/clientes' && !dismissedAlerts.current.has('new-clients')) {
        const checkDate = user.last_clients_check || user.created
        if (checkDate) {
          const res = await pb.collection('clients').getList(1, 1, {
            filter: `created > "${checkDate}"`,
            sort: '-created',
            requestKey: null,
          })
          if (res.totalItems > 0) {
            setLatestClient(res.items[0])
            setActiveAlert('new-clients')
            return
          }
        }
      }

      setActiveAlert(null)
    } catch (e) {
      console.error('Failed to check alerts', e)
    } finally {
      isChecking.current = false
    }
  }, [user, location.pathname])

  useEffect(() => {
    if (location.pathname === '/clientes' && activeAlert === 'new-clients') {
      handleDismiss('new-clients')
    } else {
      checkAlerts()
    }
  }, [location.pathname, checkAlerts, activeAlert])

  useRealtime(
    'clients',
    (e) => {
      if (location.pathname !== '/clientes' && e.action === 'create') {
        dismissedAlerts.current.delete('new-clients')
        checkAlerts()
      }
    },
    location.pathname !== '/clientes',
  )

  const handleDismiss = async (type: AlertType) => {
    if (!type) return

    // Immediate UI feedback and local prevention
    dismissedAlerts.current.add(type)
    setActiveAlert(null)

    if (type === 'profile') {
      localStorage.setItem(`dismissed_profile_${user?.id}`, 'true')
      setTimeout(checkAlerts, 600)
    } else if (type === 'system') {
      localStorage.setItem(`dismissed_system_v0.1.127_${user?.id}`, 'true')
      setTimeout(checkAlerts, 600)
    } else if (type === 'new-clients') {
      if (user?.id) {
        try {
          const now = new Date()
          // Add 1s to gracefully avoid strict overlap issues with current items
          now.setSeconds(now.getSeconds() + 1)
          const updatedUser = await pb.collection('users').update(user.id, {
            last_clients_check: now.toISOString(),
          })
          // Sync authStore immediately for consistent state across the app & mobile devices
          pb.authStore.save(pb.authStore.token, updatedUser)
        } catch (e) {
          console.error('Failed to update last check', e)
        }
      }
      setTimeout(checkAlerts, 600)
    }
  }

  if (!activeAlert) return null

  return (
    <Dialog open={!!activeAlert} onOpenChange={(val) => !val && handleDismiss(activeAlert)}>
      <DialogContent className="bg-[#0b1121] border-[#1e293b] text-white sm:max-w-[425px] p-8 shadow-2xl rounded-2xl [&>button]:hidden z-[100]">
        <button
          onClick={() => handleDismiss(activeAlert)}
          className="absolute right-4 top-4 rounded-full border border-slate-700 bg-slate-900/50 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Fechar</span>
        </button>

        <div className="flex flex-col items-center justify-center gap-4 text-center mt-2 animate-in fade-in zoom-in-95 duration-300">
          {activeAlert === 'new-clients' && (
            <>
              <div className="relative">
                <Avatar className="w-16 h-16 border-2 border-blue-500/30 shadow-lg">
                  <AvatarImage
                    src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${latestClient?.id || '1'}`}
                  />
                  <AvatarFallback className="bg-slate-800 text-blue-400">
                    <UserIcon className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1.5 border-2 border-[#0b1121] shadow-sm">
                  <Bell className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold tracking-tight text-white m-0">
                  Novos Clientes
                </DialogTitle>
                <DialogDescription className="text-slate-300 text-[15px] leading-relaxed">
                  Você possui novos clientes cadastrados (como{' '}
                  <strong className="text-white font-medium">
                    {latestClient?.nome_cliente || 'recentes'}
                  </strong>
                  ) desde o seu último acesso.
                </DialogDescription>
              </div>
              <button
                onClick={() => {
                  handleDismiss('new-clients')
                  navigate('/clientes')
                }}
                className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors w-full sm:w-auto"
              >
                Ver Clientes
              </button>
            </>
          )}

          {activeAlert === 'profile' && (
            <>
              <div className="relative">
                <Avatar className="w-16 h-16 border-2 border-orange-500/30 shadow-lg">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-slate-800 text-orange-400">
                    <UserIcon className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-orange-500 rounded-full p-1.5 border-2 border-[#0b1121] shadow-sm">
                  <Info className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold tracking-tight text-white m-0">
                  Complete seu Perfil
                </DialogTitle>
                <DialogDescription className="text-slate-300 text-[15px] leading-relaxed">
                  Adicione uma foto de perfil ou avatar para uma experiência mais personalizada no
                  sistema.
                </DialogDescription>
              </div>
              <button
                onClick={() => {
                  handleDismiss('profile')
                  navigate('/configuracao')
                }}
                className="mt-4 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-full transition-colors w-full sm:w-auto"
              >
                Configurar Agora
              </button>
            </>
          )}

          {activeAlert === 'system' && (
            <>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-emerald-500/30 flex items-center justify-center shadow-lg">
                  <ShieldAlert className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1.5 border-2 border-[#0b1121] shadow-sm">
                  <Info className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold tracking-tight text-white m-0">
                  Atualização Concluída
                </DialogTitle>
                <DialogDescription className="text-slate-300 text-[15px] leading-relaxed">
                  O sistema foi atualizado para a versão{' '}
                  <strong className="text-white font-medium">v0.1.127 (Inspetor)</strong>. Diversas
                  melhorias e correções foram aplicadas.
                </DialogDescription>
              </div>
              <button
                onClick={() => handleDismiss('system')}
                className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-full transition-colors w-full sm:w-auto"
              >
                Entendido
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
