export const logAudit = async (action: string, details: string) => {
  // Mock audit logger decoupled from backend
  console.log(`[AUDIT] ${action}: ${details}`)
}
