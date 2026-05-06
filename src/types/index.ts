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
  previous_status?: string | null
  observacoes?: string
  observacao_lida?: boolean
  data_leitura_observacao?: string
  data_baixa?: string
  created: string
  updated: string
  expand?: {
    colaborador?: { id: string; name: string; color?: string }
    solicitacao?: { id: string; name: string; color?: string }
    status?: { id: string; name: string; color?: string }
    previous_status?: { id: string; name: string; color?: string }
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
  user?: string
  action: string
  details?: string
  created: string
  updated: string
  expand?: {
    user?: User
  }
}

export interface Payroll {
  id: string
  employee: string
  base_salary: number
  install_commission: number
  bonus: number
  extra_1: number
  extra_2: number
  extra_3: number
  extra_4: number
  total: number
  reference_date: string
  status: string
  observations?: string
  closed?: boolean
  created: string
  updated: string
  expand?: {
    employee?: User
  }
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
  last_clients_check?: string
}

export interface PasswordResetRequest {
  id: string
  email: string
  timestamp: string
  status: 'pending' | 'resolved'
}
