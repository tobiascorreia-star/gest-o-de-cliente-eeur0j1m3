import { useState } from 'react'
import { useApp } from '@/contexts/app-context'
import { useAuth } from '@/hooks/use-auth'

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
      sessionStorage.setItem('temp_password', password)
      navigate('/')
    } else {
      toast({
        title: 'Acesso Negado',
        description:
          error?.message === 'Sua conta está inativa. Por favor, contate o administrador.'
            ? error.message
            : 'E-mail ou senha incorretos.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-sky-50 p-4 relative overflow-hidden">
      {/* Decorative blurred circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-sky-300/20 rounded-full blur-[100px]" />

      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/50 p-8 rounded-2xl shadow-xl z-10 animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-tr from-blue-600 to-sky-400 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-wide">GESTÃO Cliente</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">SISTEMA DE GESTÃO EMPRESARIAL</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 ml-1">E-mail de Acesso</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="email"
                placeholder="tobiascorreia@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-white/50 border-slate-200 text-slate-800 placeholder:text-slate-400 h-12 rounded-xl focus-visible:ring-blue-500 transition-all shadow-sm hover:border-blue-300 focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-medium text-slate-700">Senha</label>
              <button
                type="button"
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium"
                onClick={() => {
                  if (!email) {
                    toast({
                      title: 'Atenção',
                      description: 'Digite seu e-mail de acesso para recuperar a senha.',
                      variant: 'destructive',
                    })
                    return
                  }

                  requestPasswordReset(email)
                  toast({
                    title: 'Recuperação',
                    description: 'Um e-mail foi enviado com as instruções se a conta existir.',
                  })
                }}
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-white/50 border-slate-200 text-slate-800 placeholder:text-slate-400 h-12 rounded-xl focus-visible:ring-blue-500 transition-all shadow-sm hover:border-blue-300 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-xl transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5"
          >
            Acessar Sistema
          </Button>
        </form>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center z-10">
        <p className="text-xs text-slate-500 font-medium">
          © 2026 - MegaFllex Soluções - Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
