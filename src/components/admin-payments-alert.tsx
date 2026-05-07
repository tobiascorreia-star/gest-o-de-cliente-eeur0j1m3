import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'
import { isToday, isPast, startOfDay } from 'date-fns'

const playBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const audioCtx = new AudioContextClass()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    oscillator.type = 'sine'
    oscillator.frequency.value = 800
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5)
    oscillator.start(audioCtx.currentTime)
    oscillator.stop(audioCtx.currentTime + 0.5)
  } catch {
    /* intentionally ignored */
  }
}

export function AdminPaymentsAlert() {
  const { user } = useAuth()
  const alertedIds = useRef<Set<string>>(new Set())

  const checkAlerts = async () => {
    if (user?.role?.toLowerCase() !== 'admin') return

    try {
      const payments = await pb.collection('admin_payments').getFullList({
        filter: 'status = false',
      })

      let shouldBeep = false

      payments.forEach((payment) => {
        if (alertedIds.current.has(payment.id)) return
        if (!payment.due_date) return

        const dueDateStr = payment.due_date.replace(' ', 'T')
        const dueDate = startOfDay(new Date(dueDateStr))

        if (isToday(dueDate) || isPast(dueDate)) {
          alertedIds.current.add(payment.id)
          shouldBeep = true

          toast.warning(`Aviso de Pagamento: ${payment.name}`, {
            description: isToday(dueDate)
              ? 'O pagamento vence hoje.'
              : 'O pagamento está em atraso.',
            duration: 10000,
          })
        }
      })

      if (shouldBeep) {
        playBeep()
      }
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    if (!user) return
    checkAlerts()
    const interval = setInterval(checkAlerts, 1000 * 60 * 30) // 30 minutes
    return () => clearInterval(interval)
  }, [user])

  useRealtime(
    'admin_payments',
    () => {
      checkAlerts()
    },
    user?.role?.toLowerCase() === 'admin',
  )

  return null
}
