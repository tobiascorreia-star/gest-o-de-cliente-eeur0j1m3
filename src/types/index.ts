export interface LookupItem {
  id: string
  name: string
  color?: string
}

export interface Client {
  id: string
  cnpj: string
  razaoSocial: string
  nome: string
  colaboradorId: string
  solicitacaoId: string
  statusId: string
  categoriaId: string
  dataCadastro: string
  dataBaixa?: string
  obs?: string
  pgtoId: string
  previousStatusId?: string
}

export interface AlertConfig {
  moderateDays: number
  criticalDays: number
  oldDays: number
  veryCriticalDays: number
}

export interface HistoryLog {
  id: string
  clientId: string
  action: string
  timestamp: string
  userId: string
}

export interface AuditLog {
  id: string
  userName: string
  action: string
  target: string
  timestamp: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Operator'
  avatarUrl?: string
  password?: string
}

export interface PasswordResetRequest {
  id: string
  email: string
  timestamp: string
  status: 'pending' | 'resolved'
}
