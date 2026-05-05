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
          .collection('audit_logs')
          .getFullList({
            filter: "action = 'password_reset_request'",
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
        auditLogsData
          .filter((log: any) => !log.details.includes('[RESOLVIDO]'))
          .map((log: any) => {
            const emailMatch = log.details.match(/e-mail:\s*(.+)$/i)
            const user = log.expand?.user
            const identity = user?.name
              ? `${user.name} (${user.email})`
              : emailMatch
                ? emailMatch[1]
                : 'Desconhecido'
            return {
              id: log.id,
              email: identity,
              timestamp: log.created,
              status: 'pending',
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
      await pb.send('/backend/v1/password-reset-resolve', {
        method: 'POST',
        body: JSON.stringify({ id }),
      })
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
