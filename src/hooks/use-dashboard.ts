import { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export function useDashboard() {
  const [clients, setClients] = useState<any[]>([])
  const [alertSettings, setAlertSettings] = useState<any>({
    moderate_threshold: 10,
    critical_threshold: 20,
    old_days: 15,
    critical_days: 30,
  })
  const [categories, setCategories] = useState<any[]>([])
  const [statuses, setStatuses] = useState<any[]>([])
  const [passwordResetRequests, setPasswordResetRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [clientsData, configData, auditLogsData] = await Promise.all([
        pb.collection('clients').getFullList({ expand: 'categoria,status' }),
        pb.collection('configurations').getFullList(),
        pb
          .collection('notifications')
          .getFullList({
            filter: "type = 'password_reset' && resolved = false",
            sort: '-created',
            expand: 'user',
          })
          .catch(() => []),
      ])

      let alertData
      try {
        alertData = await pb.collection('alert_settings').getFirstListItem('')
      } catch (_) {
        alertData = {
          moderate_threshold: 10,
          critical_threshold: 20,
          old_days: 15,
          critical_days: 30,
        }
      }

      setClients(clientsData)
      setAlertSettings(alertData)
      setCategories(configData.filter((c) => c.type === 'categoria'))
      setStatuses(configData.filter((c) => c.type === 'status'))

      setPasswordResetRequests(
        auditLogsData.map((notif: any) => {
          const user = notif.expand?.user
          const identity =
            user?.name && user?.email
              ? `${user.name} (${user.email})`
              : user?.email || 'Desconhecido'
          return {
            id: notif.id,
            email: identity,
            timestamp: notif.created,
            status: notif.resolved ? 'resolved' : 'pending',
          }
        }),
      )
    } catch (e) {
      console.error('Error loading dashboard data', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const resolvePasswordReset = async (id: string) => {
    try {
      await pb.collection('notifications').update(id, { resolved: true })
      loadData()
    } catch (e) {
      console.error('Error resolving password reset', e)
    }
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('clients', () => {
    loadData()
  })
  useRealtime('alert_settings', () => {
    loadData()
  })
  useRealtime('configurations', () => {
    loadData()
  })
  useRealtime('audit_logs', () => {
    loadData()
  })
  useRealtime('notifications', () => {
    loadData()
  })

  return {
    clients,
    alertSettings,
    categories,
    statuses,
    passwordResetRequests,
    resolvePasswordReset,
    loading,
  }
}
