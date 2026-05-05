import pb from '@/lib/pocketbase/client'
import { AuditLog } from '@/types'

export const getAuditLogs = () =>
  pb.collection('audit_logs').getFullList<AuditLog>({
    sort: '-created',
    expand: 'user',
  })

export const clearAuditLogs = async () => {
  try {
    const logs = await pb.collection('audit_logs').getFullList({ fields: 'id' })
    await Promise.all(logs.map((log) => pb.collection('audit_logs').delete(log.id)))
  } catch (e) {
    console.error('Failed to clear audit logs', e)
    throw e
  }
}

export const logAudit = async (action: string, details: string) => {
  try {
    await pb.collection('audit_logs').create({
      action,
      details,
      user: pb.authStore.record?.id,
    })
  } catch (e) {
    console.error('Failed to log audit manually', e)
  }
}
