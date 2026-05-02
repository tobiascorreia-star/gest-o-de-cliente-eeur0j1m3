import pb from '@/lib/pocketbase/client'

export const logAudit = async (action: string, details: string) => {
  try {
    if (!pb.authStore.isValid) return
    await pb.collection('audit_logs').create({
      action,
      details,
      user: pb.authStore.record?.id,
    })
  } catch (err) {
    console.error('Failed to log audit:', err)
  }
}
