import { useState, useEffect } from 'react'
import { Bell, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'

export function PayrollEducationAlert() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  const loadNotifications = async () => {
    if (user?.role?.toLowerCase() !== 'admin') return
    try {
      const records = await pb.collection('notifications').getFullList({
        filter: `user = "${user.id}" && resolved = false && type ~ "payroll_education_reminder"`,
        sort: '-created',
      })
      setNotifications(records)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [user])

  useRealtime('notifications', () => {
    loadNotifications()
  })

  if (user?.role?.toLowerCase() !== 'admin') return null
  if (notifications.length === 0) return null

  const handleResolve = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await pb.collection('notifications').update(id, { resolved: true })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const handleClick = () => {
    navigate('/educacao-financeira-admin')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9 border-slate-200 dark:border-slate-800"
        >
          <Bell className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
            {notifications.length}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-t-md">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Alertas de Educação Financeira
          </h4>
        </div>
        <div className="flex max-h-[300px] flex-col overflow-y-auto">
          {notifications.map((n) => {
            const parts = n.type.split('|')
            const mes = parts[1] || ''
            const ano = parts[2] || ''
            const nome = parts[3] || ''

            return (
              <div
                key={n.id}
                onClick={handleClick}
                className="flex cursor-pointer flex-col items-start gap-2 border-b border-slate-100 dark:border-slate-800 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors last:border-0"
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium leading-snug text-slate-800 dark:text-slate-200">
                      Alteração na folha detectada. Lembre-se de atualizar a Educação Financeira.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {nome ? <span className="font-semibold">{nome}</span> : null}
                      {nome ? ' - ' : ''}
                      {mes}/{ano}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 hover:bg-green-100 dark:hover:bg-green-900/30"
                    onClick={(e) => handleResolve(n.id, e)}
                    title="Marcar como lido"
                  >
                    <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
