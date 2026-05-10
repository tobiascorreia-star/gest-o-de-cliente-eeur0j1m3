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
  colaborador_responsavel?: string
  colaborador_id?: string
  solicitacao?: string
  status?: string
  categoria?: string
  pgto?: string
  previous_status?: string | null
  observacoes?: string
  observacao_lida?: boolean
  data_leitura_observacao?: string
  data_baixa?: string
  last_modified_by?: string
  created: string
  updated: string
  expand?: {
    colaborador?: { id: string; name: string; color?: string }
    solicitacao?: { id: string; name: string; color?: string }
    status?: { id: string; name: string; color?: string }
    previous_status?: { id: string; name: string; color?: string }
    categoria?: { id: string; name: string; color?: string }
    pgto?: { id: string; name: string; color?: string }
    last_modified_by?: User
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
  colaborador: string
  mes_referencia: number
  ano_referencia: number
  base_salary: number
  unit_value?: number
  qtde_install?: number
  manual_install_qty?: boolean
  install_commission: number
  incentivo?: number
  bonus: number
  desconto?: number
  extra_1: number
  extra_2: number
  extra_3: number
  extra_4: number
  total_a_pagar: number
  status: string
  observacoes?: string
  closed?: boolean
  created: string
  updated: string
  expand?: {
    colaborador?: User
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

export interface PayrollSettings {
  id: string
  reference_date: string
  quantity: number
  created: string
  updated: string
}

export interface FinancialEducation {
  id: string
  user: string
  net_value: number
  admin_message?: string
  sync_date?: string
  month: number
  year: number
  created: string
  updated: string
  expand?: {
    user?: User
  }
}

export interface AdminPayment {
  id: string
  dono_pagamento: string
  descricao: string
  data_notificacao?: string
  data_pagamento_realizado?: string
  status: boolean
  observacao?: string
  mes_referencia: number
  ano_referencia: number
  admin: string
  created: string
  updated: string
}
