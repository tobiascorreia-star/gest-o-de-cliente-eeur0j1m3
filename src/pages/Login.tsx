import { useState } from 'react'
import { useApp } from '@/contexts/app-context'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Eye, EyeOff, KeyRound, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/hooks/use-toast'

export default function Login() {
  const { requestPasswordReset } = useApp()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const { error } = await signIn(email, password)
    setIsLoading(false)

    if (!error) {
      navigate('/')
    } else {
      toast({
        title: 'Acesso Negado',
        description: 'Credenciais inválidas.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2B3088] via-[#1B1E5A] to-[#0A0D30] p-4 relative overflow-hidden">
      {/* Decorative blurred circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl z-10 animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-tr from-accent to-yellow-300 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide">GESTÃO Cliente</h1>
          <p className="text-white/60 text-sm mt-2">SISTEMA DE GESTÃO EMPRESARIAL</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/80 ml-1">E-mail de Acesso</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                type="email"
                placeholder="tobiascorreia@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus-visible:ring-accent"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-medium text-white/80">Senha</label>
              <button
                type="button"
                className="text-xs text-accent hover:text-white transition-colors"
                onClick={() => {
                  if (!email) {
                    toast({
                      title: 'Atenção',
                      description: 'Digite seu e-mail de acesso para recuperar a senha.',
                      variant: 'destructive',
                    })
                    return
                  }

                  try {
                    pb.collection('users').requestPasswordReset(email)
                    toast({
                      title: 'Recuperação',
                      description: 'Um e-mail foi enviado com as instruções se a conta existir.',
                    })
                  } catch (err) {
                    toast({
                      title: 'Erro',
                      description: 'Não foi possível solicitar a redefinição de senha.',
                      variant: 'destructive',
                    })
                  }
                }}
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-black/20 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus-visible:ring-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 mt-4 bg-accent hover:bg-accent/90 text-primary font-bold text-base rounded-xl transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)]"
          >
            Acessar Sistema
          </Button>
        </form>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center z-10">
        <p className="text-xs text-white/30">
          © 2026 - MegaFllex Soluções - Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
