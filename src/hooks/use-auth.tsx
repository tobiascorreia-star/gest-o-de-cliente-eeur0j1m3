import { createContext, useContext, useState, ReactNode } from 'react'

interface AuthContextType {
  user: any
  signIn: (email: string, password?: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('currentUser')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)

  const signIn = async (email: string, password?: string) => {
    setLoading(true)
    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 500))
    setLoading(false)

    if (email) {
      const mockUser = {
        id: 'u1',
        name: 'Administrador',
        email,
        role: 'admin',
        avatarUrl: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1',
        active: true,
      }
      setUser(mockUser)
      localStorage.setItem('currentUser', JSON.stringify(mockUser))
      return { error: null }
    }
    return { error: new Error('Credenciais inválidas') }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('currentUser')
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
