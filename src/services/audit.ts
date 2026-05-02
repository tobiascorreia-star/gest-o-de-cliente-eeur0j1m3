import pb from '@/lib/pocketbase/client'

export const logAudit = async (action: string, details: string) => {
  try {
    const user = pb.authStore.record?.id
    await pb.collection('audit_logs').create({
      action,
      user,
      details,
    })
  } catch (err) {
    console.error('Failed to create audit log', err)
  }
}
