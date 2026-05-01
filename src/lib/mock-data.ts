import { AlertConfig, AuditLog, Client, HistoryLog, LookupItem, User } from '@/types'

export const mockColaboradores: LookupItem[] = [
  { id: 'c1', name: 'Ana Silva' },
  { id: 'c2', name: 'Carlos Santos' },
  { id: 'c3', name: 'Mariana Costa' },
]

export const mockSolicitacoes: LookupItem[] = [
  { id: 'so1', name: 'Renovação de Contrato' },
  { id: 'so2', name: 'Suporte Técnico' },
  { id: 'so3', name: 'Nova Instalação' },
  { id: 'so4', name: 'Cancelamento' },
]

export const mockStatus: LookupItem[] = [
  { id: 'st1', name: 'Em Aberto', color: 'bg-blue-100 text-blue-800' },
  { id: 'st2', name: 'Em Análise', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'st3', name: 'Baixa', color: 'bg-green-100 text-green-800' },
]

export const mockCategorias: LookupItem[] = [
  { id: 'cat1', name: 'VIP', color: 'bg-purple-100 text-purple-800' },
  { id: 'cat2', name: 'Regular', color: 'bg-gray-100 text-gray-800' },
  { id: 'cat3', name: 'Novo', color: 'bg-teal-100 text-teal-800' },
]

export const mockPgtoTipos: LookupItem[] = [
  { id: 'p1', name: 'Pix' },
  { id: 'p2', name: 'Boleto' },
  { id: 'p3', name: 'Cartão de Crédito' },
  { id: 'p4', name: 'Transferência' },
]

const today = new Date()
const minusDays = (days: number) =>
  new Date(today.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

export const mockClients: Client[] = []

export const mockAlertConfig: AlertConfig = {
  moderateDays: 7,
  criticalDays: 14,
  oldDays: 30,
  veryCriticalDays: 45,
}

export const mockHistory: HistoryLog[] = []

export const mockAudit: AuditLog[] = []

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Administrador',
    email: 'tobias@megafllex',
    role: 'Admin',
    avatarUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1',
    password: 'Fui3G35@',
  },
]
