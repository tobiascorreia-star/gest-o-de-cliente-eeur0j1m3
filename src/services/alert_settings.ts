import pb from '@/lib/pocketbase/client'

export const getAlertSettings = () => pb.collection('alert_settings').getFullList()

export const updateAlertSettings = (id: string, data: any) =>
  pb.collection('alert_settings').update(id, data)
