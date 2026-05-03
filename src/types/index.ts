export interface LookupItem {
  id: string
  name: string
  color?: string
}

export interface Client {
  id: string
  cnpj: string
  razao_social: string
  nome_cliente: string
  colaborador?: string
  solicitacao?: string
  status?: string
  categoria?: string
  pgto?: string
  observacoes?: string
  created: string
  updated: string
  expand?: {
    colaborador?: { id: string; name: string; color?: string }
    solicitacao?: { id: string; name: string; color?: string }
    status?: { id: string; name: string; color?: string }
    categoria?: { id: string; name: string; color?: string }
    pgto?: { id: string; name: string; color?: string }
  }
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
  phone?: string
  active?: boolean
}

export interface PasswordResetRequest {
  id: string
  email: string
  timestamp: string
  status: 'pending' | 'resolved'
}
