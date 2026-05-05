import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShieldAlert, Info } from 'lucide-react'
import { APP_VERSION } from '@/constants/version'
import { useAuth } from '@/hooks/use-auth'

export function UpdateNotification() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const lastVersion = localStorage.getItem('app-version')
      if (lastVersion && lastVersion !== APP_VERSION) {
        setIsOpen(true)
      } else if (!lastVersion) {
        localStorage.setItem('app-version', APP_VERSION)
      }
    }
  }, [user])

  const handleClose = () => {
    localStorage.setItem('app-version', APP_VERSION)
    setIsOpen(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent className="sm:max-w-[400px] bg-[#0F172A] border-[#1E293B] text-white shadow-2xl [&>button]:hidden rounded-2xl p-0">
        <DialogHeader className="flex flex-col items-center justify-center space-y-0 pt-10 pb-2 px-6">
          <div className="relative mb-6 inline-flex">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#1E293B] border-4 border-[#0F172A] shadow-[0_0_0_2px_rgba(51,65,85,1)]">
              <ShieldAlert className="h-8 w-8 text-[#10B981]" strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#10B981] border-[3px] border-[#0F172A]">
              <Info className="h-4 w-4 text-white" strokeWidth={3} />
            </div>
          </div>
          <DialogTitle className="text-[22px] font-bold text-white text-center tracking-tight">
            Atualização Concluída
          </DialogTitle>
          <DialogDescription className="text-center text-slate-300 text-[15px] max-w-[300px] mx-auto leading-relaxed mt-4">
            O sistema foi atualizado para a versão{' '}
            <strong className="font-semibold text-white">{APP_VERSION}</strong>. Diversas melhorias
            e correções foram aplicadas.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center pb-8 pt-4">
          <Button
            type="button"
            onClick={handleClose}
            className="bg-[#10B981] hover:bg-[#059669] text-white px-10 h-11 rounded-full font-medium transition-colors"
          >
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
