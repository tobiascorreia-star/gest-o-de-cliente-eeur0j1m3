import { Bell, BellOff, BellRing, Loader2, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { toast } from 'sonner'

export function PushNotificationButton() {
  const { isSupported, isSubscribed, permission, isLoading, subscribe, unsubscribe } =
    usePushNotifications()
  const [showDialog, setShowDialog] = useState(false)

  if (!isSupported) return null

  const handleToggle = async () => {
    if (isSubscribed) {
      const ok = await unsubscribe()
      if (ok) toast.success('Notificações push desativadas.')
      else toast.error('Erro ao desativar notificações.')
      return
    }

    if (permission === 'denied') {
      toast.error('Permissão bloqueada. Habilite nas configurações do navegador.', {
        duration: 6000,
      })
      return
    }

    setShowDialog(true)
  }

  const handleConfirm = async () => {
    setShowDialog(false)
    const ok = await subscribe()
    if (ok) {
      toast.success('Notificações push ativadas! Você receberá alertas no celular.', {
        duration: 5000,
      })
    } else if (permission === 'denied') {
      toast.error('Permissão negada. Habilite nas configurações do navegador.')
    }
  }

  const icon = isLoading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : isSubscribed ? (
    <BellRing className="h-4 w-4 text-cyan-400" />
  ) : (
    <Bell className="h-4 w-4" />
  )

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggle}
              disabled={isLoading}
              className={
                isSubscribed
                  ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10'
                  : 'text-muted-foreground hover:text-foreground'
              }
            >
              {icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isSubscribed ? 'Notificações push ativas (clique para desativar)' : 'Ativar notificações push no celular'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-cyan-500" />
              Notificações no Celular
            </DialogTitle>
            <DialogDescription className="text-base mt-2 leading-relaxed">
              Ative para receber alertas diretamente no seu celular mesmo com o aplicativo fechado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {[
              'Clientes com prazo vencido',
              'Pagamentos administrativos em atraso',
              'Novas solicitações de senha',
              'Lembretes de folha de pagamento',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
              Agora não
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              <BellRing className="mr-2 h-4 w-4" />
              Ativar notificações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function PushNotificationBanner() {
  const { isSupported, isSubscribed, permission, subscribe } = usePushNotifications()
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('push_banner_dismissed') === 'true'
  )

  if (!isSupported || isSubscribed || permission === 'denied' || dismissed) return null

  const handleEnable = async () => {
    const ok = await subscribe()
    if (ok) {
      toast.success('Notificações push ativadas!')
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('push_banner_dismissed', 'true')
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-cyan-950/60 border border-cyan-800/50 rounded-xl text-sm animate-fade-in-down">
      <Smartphone className="h-4 w-4 text-cyan-400 shrink-0" />
      <span className="text-cyan-200 flex-1">
        Ative notificações push para receber alertas no celular
      </span>
      <Button
        size="sm"
        onClick={handleEnable}
        className="h-7 px-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs"
      >
        Ativar
      </Button>
      <button
        onClick={handleDismiss}
        className="text-cyan-500 hover:text-cyan-300 ml-1"
        aria-label="Dispensar"
      >
        <BellOff className="h-4 w-4" />
      </button>
    </div>
  )
}
