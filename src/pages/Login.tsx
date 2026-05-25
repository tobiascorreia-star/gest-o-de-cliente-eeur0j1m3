import { useState } from 'react'
import { useApp } from '@/contexts/app-context'
import { useAuth } from '@/hooks/use-auth'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, KeyRound, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import logoUrl from '@/assets/generatedimage_1777858728629-bed4a.png'
import { toast } from '@/hooks/use-toast'
import { ModeToggle } from '@/components/mode-toggle'
import pb from '@/lib/pocketbase/client'
import { APP_VERSION } from '@/constants/version'

export default function Login() {
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden transition-colors">
      <div className="absolute top-4 right-4 z-20">
        <ModeToggle />
      </div>

      {/* Decorative blurred circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-sky-100/50 dark:bg-sky-900/20 rounded-full blur-[100px]" />

      <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-100 dark:border-slate-800 p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] z-10 animate-fade-in-up transition-colors">
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 mb-5 flex items-center justify-center">
            <img
              src={logoUrl}
              alt="System Logo"
              className="w-full h-full object-contain rounded-2xl shadow-md border border-slate-200 dark:border-slate-700"
            />
          </div>
          <h1 className="text-2xl font-medium text-slate-800 dark:text-slate-100 tracking-tight">
            Gestão Cliente
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Acesso ao sistema</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 h-12 rounded-xl bg-white dark:bg-slate-950 dark:border-slate-800 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Senha
              </label>
              <button
                type="button"
                className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                onClick={() => {
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
                    title: 'Recuperação',
                    description:
                      'Solicitação enviada à administração. Por favor, aguarde o contato para redefinição da sua senha.',
                  })
                }}
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 rounded-xl bg-white dark:bg-slate-950 dark:border-slate-800 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 mt-8 text-base rounded-xl">
            Acessar Sistema
          </Button>
        </form>
      </div>

      <div className="absolute bottom-6 left-0 right-0 text-center z-10 flex flex-col items-center gap-1">
        <p className="text-xs text-slate-400 dark:text-slate-500">© 2026 - MegaFllex Soluções</p>
        <p className="text-[10px] text-slate-300 dark:text-slate-600 font-mono tracking-widest">
          {APP_VERSION}
        </p>
      </div>
    </div>
  )
}
