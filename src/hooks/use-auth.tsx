import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

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
  const [user, setUser] = useState<any>(pb.authStore.record)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      if (pb.authStore.isValid && pb.authStore.token) {
        try {
          await pb.collection('users').authRefresh()
          setUser(pb.authStore.record)
        } catch (error) {
          pb.authStore.clear()
          setUser(null)
        }
      } else {
        pb.authStore.clear()
        setUser(null)
      }
      setLoading(false)
    }

    initAuth()

    const unsubscribe = pb.authStore.onChange((_token, record) => {
      if (!pb.authStore.isValid) {
        setUser(null)
      } else {
        setUser(record)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useRealtime(
    'users',
    (e) => {
      if (user?.id && e.record.id === user.id) {
        if (e.action === 'update') {
          pb.authStore.save(pb.authStore.token, e.record)
        } else if (e.action === 'delete' || e.record.active === false) {
          signOut()
        }
      }
    },
    !!user?.id,
  )

  const signIn = async (email: string, password?: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password || '')

      if (authData.record.active === false) {
        pb.authStore.clear()
        return { error: new Error('Sua conta está inativa. Por favor, contate o administrador.') }
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    sessionStorage.removeItem('temp_password')
    pb.authStore.clear()
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
