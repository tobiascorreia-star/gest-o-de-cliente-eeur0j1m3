import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export default function Setup() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [oldPassword] = useState(() => sessionStorage.getItem('temp_password') || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!oldPassword) {
      toast({
        title: 'Sessão expirada',
        description: 'Por favor, faça login novamente para concluir a configuração.',
        variant: 'destructive',
      })
      navigate('/login')
      return
    }

    if (password !== passwordConfirm) {
      toast({
        title: 'Erro de validação',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 8) {
      toast({
        title: 'Erro de validação',
        description: 'A senha deve ter no mínimo 8 caracteres.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const record = await pb.collection('users').update(user.id, {
        oldPassword,
        password,
        passwordConfirm,
        setup_completed: true,
      })

      pb.authStore.save(pb.authStore.token, record)
      sessionStorage.removeItem('temp_password')

      toast({
        title: 'Sucesso',
        description: 'Configuração concluída com sucesso!',
      })

      navigate('/')
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        const messages = Object.entries(fieldErrors)
          .map(([field, msg]) => {
            if (field === 'oldPassword') return 'Senha atual incorreta ou ausente.'
            if (field === 'password') return 'A nova senha não atende aos requisitos.'
            return `${field}: ${msg}`
          })
          .join(' | ')
        toast({
          title: 'Erro de validação',
          description: messages,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Erro ao salvar',
          description: error.message || 'Erro inesperado.',
          variant: 'destructive',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2B3088] via-[#1B1E5A] to-[#0A0D30] p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl z-10 animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-tr from-accent to-yellow-300 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide text-center">
            Primeiro Acesso
          </h1>
          <p className="text-white/60 text-sm mt-2 text-center">
            Para garantir a segurança da sua conta, por favor, defina uma nova senha.
          </p>
        </div>

        <form onSubmit={handleSetup} className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-white/80 ml-1">Nova Senha *</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="pr-10 bg-black/20 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus-visible:ring-accent"
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

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-white/80 ml-1">Confirmar Nova Senha *</Label>
            <div className="relative">
              <Input
                type={showPasswordConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                minLength={8}
                className="pr-10 bg-black/20 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus-visible:ring-accent"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
              >
                {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !password || password !== passwordConfirm || password.length < 8}
            className="w-full h-12 mt-4 bg-accent hover:bg-accent/90 text-primary font-bold text-base rounded-xl transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Concluir Configuração'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
