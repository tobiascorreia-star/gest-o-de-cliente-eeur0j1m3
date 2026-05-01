import React, { createContext, useContext, useState, ReactNode } from 'react'
import { AlertConfig, AuditLog, Client, HistoryLog, LookupItem, User } from '@/types'
import {
  mockAlertConfig,
  mockAudit,
  mockCategorias,
  mockClients,
  mockColaboradores,
  mockHistory,
  mockPgtoTipos,
  mockSolicitacoes,
  mockStatus,
  mockUsers,
} from '@/lib/mock-data'

interface AppContextType {
  currentUser: User | null
  login: (email: string) => boolean
  logout: () => void
  lastLoginTime: string | null
  clients: Client[]
  setClients: React.Dispatch<React.SetStateAction<Client[]>>
  colaboradores: LookupItem[]
  solicitacoes: LookupItem[]
  statusList: LookupItem[]
  categorias: LookupItem[]
  pgtoTipos: LookupItem[]
  alertConfig: AlertConfig
  setAlertConfig: React.Dispatch<React.SetStateAction<AlertConfig>>
  history: HistoryLog[]
  audit: AuditLog[]
  users: User[]
  addClient: (client: Client) => void
  updateClient: (client: Client) => void
  deleteClient: (id: string) => void
  markClientAsCompleted: (id: string) => void
  reverseClientBaixa: (id: string) => void
  addUser: (user: Omit<User, 'id'>) => void
  updateUser: (user: User) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(mockClients)
  const [colaboradores] = useState<LookupItem[]>(mockColaboradores)
  const [solicitacoes] = useState<LookupItem[]>(mockSolicitacoes)
  const [statusList] = useState<LookupItem[]>(mockStatus)
  const [categorias] = useState<LookupItem[]>(mockCategorias)
  const [pgtoTipos] = useState<LookupItem[]>(mockPgtoTipos)
  const [alertConfig, setAlertConfig] = useState<AlertConfig>(mockAlertConfig)
  const [history, setHistory] = useState<HistoryLog[]>(mockHistory)
  const [audit] = useState<AuditLog[]>(mockAudit)
  const [users, setUsers] = useState<User[]>(mockUsers)

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser')
    return saved ? JSON.parse(saved) : null
  })

  const [lastLoginTime, setLastLoginTime] = useState<string | null>(() => {
    return localStorage.getItem('previousLoginTime') || null
  })

  const login = (email: string) => {
    const foundUser = users.find((u) => u.email === email)
    if (foundUser) {
      setCurrentUser(foundUser)
      const now = new Date().toISOString()
      const prev = localStorage.getItem('currentLoginTime') || now

      setLastLoginTime(prev)
      localStorage.setItem('previousLoginTime', prev)
      localStorage.setItem('currentLoginTime', now)
      localStorage.setItem('currentUser', JSON.stringify(foundUser))
      return true
    }
    return false
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem('currentUser')
  }

  const addClient = (client: Client) => {
    setClients((prev) => [client, ...prev])
    setHistory((prev) => [
      {
        id: Date.now().toString(),
        clientId: client.id,
        action: 'Cliente Cadastrado',
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'sys',
      },
      ...prev,
    ])
  }

  const updateClient = (updatedClient: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)))
    setHistory((prev) => [
      {
        id: Date.now().toString(),
        clientId: updatedClient.id,
        action: 'Cliente Atualizado',
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'sys',
      },
      ...prev,
    ])
  }

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  const markClientAsCompleted = (id: string) => {
    const baixaStatus = statusList.find((s) => s.name === 'Baixa')?.id
    if (!baixaStatus) return

    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              previousStatusId: c.statusId,
              statusId: baixaStatus,
              dataBaixa: new Date().toISOString(),
            }
          : c,
      ),
    )
    setHistory((prev) => [
      {
        id: Date.now().toString(),
        clientId: id,
        action: 'Realizou Baixa',
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'sys',
      },
      ...prev,
    ])
  }

  const reverseClientBaixa = (id: string) => {
    const defaultStatus = statusList.find((s) => s.name === 'Em Aberto')?.id || statusList[0].id

    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const { dataBaixa, previousStatusId, ...rest } = c
        return {
          ...rest,
          statusId: previousStatusId || defaultStatus,
        }
      }),
    )
    setHistory((prev) => [
      {
        id: Date.now().toString(),
        clientId: id,
        action: 'Estornou Baixa',
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'sys',
      },
      ...prev,
    ])
  }

  const addUser = (user: Omit<User, 'id'>) => {
    setUsers((prev) => [...prev, { id: `u_${Date.now()}`, ...user }])
  }

  const updateUser = (updated: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        logout,
        lastLoginTime,
        clients,
        setClients,
        colaboradores,
        solicitacoes,
        statusList,
        categorias,
        pgtoTipos,
        alertConfig,
        setAlertConfig,
        history,
        audit,
        users,
        addClient,
        updateClient,
        deleteClient,
        markClientAsCompleted,
        reverseClientBaixa,
        addUser,
        updateUser,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
