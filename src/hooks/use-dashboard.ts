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
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [clientsData, configData] = await Promise.all([
        pb.collection('clients').getFullList({ expand: 'categoria,status' }),
        pb.collection('configurations').getFullList(),
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
    } catch (e) {
      console.error('Error loading dashboard data', e)
    } finally {
      setLoading(false)
    }
  }, [])

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

  return { clients, alertSettings, categories, statuses, loading }
}
