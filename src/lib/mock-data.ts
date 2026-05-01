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

export const mockClients: Client[] = [
  {
    id: 'cli1',
    cnpj: '12.345.678/0001-90',
    razaoSocial: 'Tech Solutions LTDA',
    nome: 'João Oliveira',
    colaboradorId: 'c1',
    solicitacaoId: 'so1',
    statusId: 'st1',
    categoriaId: 'cat1',
    dataCadastro: minusDays(5),
    obs: 'Cliente solicitou urgência na renovação.',
    pgtoId: 'p1',
  },
  {
    id: 'cli2',
    cnpj: '98.765.432/0001-10',
    razaoSocial: 'Comercial Souza ME',
    nome: 'Maria Souza',
    colaboradorId: 'c2',
    solicitacaoId: 'so2',
    statusId: 'st2',
    categoriaId: 'cat2',
    dataCadastro: minusDays(15),
    pgtoId: 'p2',
  },
  {
    id: 'cli3',
    cnpj: '45.678.901/0001-23',
    razaoSocial: 'Indústria Global S/A',
    nome: 'Pedro Alves',
    colaboradorId: 'c3',
    solicitacaoId: 'so3',
    statusId: 'st1',
    categoriaId: 'cat3',
    dataCadastro: minusDays(2),
    pgtoId: 'p3',
  },
  {
    id: 'cli4',
    cnpj: '11.222.333/0001-44',
    razaoSocial: 'Serviços Rápidos EIRELI',
    nome: 'Lucas Lima',
    colaboradorId: 'c1',
    solicitacaoId: 'so4',
    statusId: 'st3',
    categoriaId: 'cat2',
    dataCadastro: minusDays(60),
    dataBaixa: minusDays(40),
    pgtoId: 'p4',
    previousStatusId: 'st1',
  },
]

export const mockAlertConfig: AlertConfig = {
  moderateDays: 7,
  criticalDays: 14,
  oldDays: 30,
  veryCriticalDays: 45,
}

export const mockHistory: HistoryLog[] = [
  {
    id: 'h1',
    clientId: 'cli1',
    action: 'Cliente Cadastrado',
    timestamp: minusDays(5),
    userId: 'u1',
  },
  {
    id: 'h2',
    clientId: 'cli2',
    action: 'Status alterado para Em Análise',
    timestamp: minusDays(10),
    userId: 'u2',
  },
]

export const mockAudit: AuditLog[] = [
  {
    id: 'a1',
    userName: 'Admin User',
    action: 'Alterou configuração de Alertas',
    target: 'Configurações',
    timestamp: minusDays(1),
  },
  {
    id: 'a2',
    userName: 'Ana Silva',
    action: 'Realizou Baixa',
    target: 'Comercial Souza ME',
    timestamp: minusDays(2),
  },
]

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'admin@gestao.com',
    role: 'Admin',
    avatarUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1',
  },
  {
    id: 'u2',
    name: 'Ana Silva',
    email: 'ana@gestao.com',
    role: 'Operator',
    avatarUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=2',
  },
  {
    id: 'u3',
    name: 'Carlos Santos',
    email: 'carlos@gestao.com',
    role: 'Operator',
    avatarUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=3',
  },
]
