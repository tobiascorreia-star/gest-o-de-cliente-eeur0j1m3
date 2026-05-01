import React, { createContext, useContext, useState, ReactNode } from 'react'
import { AlertConfig, AuditLog, Client, HistoryLog, LookupItem, User } from '@/types'
import {
  mockAlertConfig,
  mockAudit,
  mockCategorias,
  mockClients,
  mockColaboradores,
  mockHistory,
  mockSolicitacoes,
  mockStatus,
  mockUsers,
} from '@/lib/mock-data'

interface AppContextType {
  clients: Client[]
  setClients: React.Dispatch<React.SetStateAction<Client[]>>
  colaboradores: LookupItem[]
  solicitacoes: LookupItem[]
  statusList: LookupItem[]
  categorias: LookupItem[]
  alertConfig: AlertConfig
  setAlertConfig: React.Dispatch<React.SetStateAction<AlertConfig>>
  history: HistoryLog[]
  audit: AuditLog[]
  users: User[]
  addClient: (client: Client) => void
  updateClient: (client: Client) => void
  deleteClient: (id: string) => void
  markClientAsCompleted: (id: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(mockClients)
  const [colaboradores] = useState<LookupItem[]>(mockColaboradores)
  const [solicitacoes] = useState<LookupItem[]>(mockSolicitacoes)
  const [statusList] = useState<LookupItem[]>(mockStatus)
  const [categorias] = useState<LookupItem[]>(mockCategorias)
  const [alertConfig, setAlertConfig] = useState<AlertConfig>(mockAlertConfig)
  const [history, setHistory] = useState<HistoryLog[]>(mockHistory)
  const [audit] = useState<AuditLog[]>(mockAudit)
  const [users] = useState<User[]>(mockUsers)

  const addClient = (client: Client) => {
    setClients((prev) => [client, ...prev])
    setHistory((prev) => [
      {
        id: Date.now().toString(),
        clientId: client.id,
        action: 'Cliente Cadastrado',
        timestamp: new Date().toISOString(),
        userId: 'u1',
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
        userId: 'u1',
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
        c.id === id ? { ...c, statusId: baixaStatus, dataBaixa: new Date().toISOString() } : c,
      ),
    )
    setHistory((prev) => [
      {
        id: Date.now().toString(),
        clientId: id,
        action: 'Realizou Baixa',
        timestamp: new Date().toISOString(),
        userId: 'u1',
      },
      ...prev,
    ])
  }

  return (
    <AppContext.Provider
      value={{
        clients,
        setClients,
        colaboradores,
        solicitacoes,
        statusList,
        categorias,
        alertConfig,
        setAlertConfig,
        history,
        audit,
        users,
        addClient,
        updateClient,
        deleteClient,
        markClientAsCompleted,
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
