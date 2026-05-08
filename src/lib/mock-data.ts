import { AlertConfig, AuditLog, Client, HistoryLog, LookupItem, User } from '@/types'

export const mockColaboradores: LookupItem[] = []
export const mockSolicitacoes: LookupItem[] = []
export const mockStatus: LookupItem[] = []
export const mockCategorias: LookupItem[] = []
export const mockPgtoTipos: LookupItem[] = []
export const mockClients: Client[] = []

export const mockAlertConfig: AlertConfig = {
  moderateDays: 7,
  criticalDays: 14,
  oldDays: 30,
  veryCriticalDays: 45,
}

export const mockHistory: HistoryLog[] = []
export const mockAudit: AuditLog[] = []
export const mockUsers: User[] = []
