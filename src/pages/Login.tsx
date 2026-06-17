import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, KeyRound, Mail, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import logoUrl from '@/assets/logo-transparent-04707.png'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { APP_VERSION } from '@/constants/version'

export default function Login() {
  const { signIn, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const { error } = await signIn(email, password)
    setIsLoading(false)

    if (!error) {
      sessionStorage.setItem('temp_password', password)
      navigate('/', { replace: true })
    } else {
      toast({
        title: 'Acesso Negado',
        description:
          error?.message === 'Sua conta está inativa. Entre em contato com o administrador.'
            ? error.message
            : 'E-mail ou senha incorretos.',
        variant: 'destructive',
      })
    }
  }

  const handleForgotPassword = () => {
    if (!email) {
      toast({
        title: 'Atenção',
        description: 'Digite seu e-mail de acesso para recuperar a senha.',
        variant: 'destructive',
      })
      return
    }
    pb.send('/backend/v1/password-reset-alert', {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {})
    toast({
      title: 'Recuperação enviada',
      description: 'Solicitação enviada à administração. Aguarde o contato.',
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Card */}
      <div className="relative w-full max-w-[400px] z-10">
        {/* Outer glow */}
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-cyan-500/30 via-blue-600/20 to-violet-600/20 blur-sm" />

        <div className="relative bg-card border border-border/60 rounded-3xl p-8 shadow-2xl backdrop-blur-xl animate-fade-in-up">
          {/* Logo section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-28 h-28 mb-4 group">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400/30 to-blue-600/30 blur-2xl group-hover:blur-xl transition-all duration-500" />
              <img
                src={logoUrl}
                alt="GestãoFllex"
                className="relative w-full h-full object-contain drop-shadow-2xl group-hover:-translate-y-1 transition-transform duration-500"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight gradient-text">GestãoFllex</h1>
            <p className="text-muted-foreground text-sm mt-1">MegaFllex Soluções</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="nome@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11 rounded-xl bg-background/50 border-border/60 focus:border-cyan-500/50 focus:ring-cyan-500/20 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Senha
                </label>
                <button
                  type="button"
                  className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors font-medium"
                  onClick={handleForgotPassword}
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-11 h-11 rounded-xl bg-background/50 border-border/60 focus:border-cyan-500/50 focus:ring-cyan-500/20 transition-all"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-2 rounded-xl font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-0 shadow-lg shadow-cyan-900/20 transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Acessando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Acessar Sistema
                </span>
              )}
            </Button>
          </form>

          {/* Footer inside card */}
          <div className="mt-6 pt-4 border-t border-border/40 text-center">
            <p className="text-[11px] text-muted-foreground/50 font-mono tracking-widest">
              {APP_VERSION}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-10">
        <p className="text-xs text-muted-foreground/40">© 2026 MegaFllex Soluções</p>
      </div>
    </div>
  )
}
