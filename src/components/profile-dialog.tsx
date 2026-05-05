import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Eye, EyeOff, Loader2, Upload, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { useAuth } from '@/hooks/use-auth'

const formatPhone = (val: string) => {
  if (!val) return ''
  let value = val.replace(/\D/g, '')
  if (value.length > 11) value = value.slice(0, 11)
  if (value.length > 10) {
    return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`
  } else if (value.length > 6) {
    return `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`
  } else if (value.length > 2) {
    return `(${value.slice(0, 2)}) ${value.slice(2)}`
  } else if (value.length > 0) {
    return `(${value}`
  }
  return value
}

export function ProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchLatestUser = async () => {
      if (open && user?.id) {
        try {
          const latestUser = await pb.collection('users').getOne(user.id)
          setName(latestUser.name || '')
          setPhone(formatPhone(latestUser.phone || ''))
          setOldPassword('')
          setPassword('')
          setPasswordConfirm('')

          const currentAvatarUrl =
            latestUser.avatarUrl ||
            (latestUser.avatar ? pb.files.getURL(latestUser, latestUser.avatar) : null)
          setAvatarPreview(currentAvatarUrl)
          setAvatarFile(null)
          setRemoveAvatar(false)
          setShowPassword(false)
          setShowPasswordConfirm(false)
          setIsSaving(false)
        } catch (e) {
          // Fallback to context user if fetch fails
          setName(user.name || '')
          setPhone(formatPhone(user.phone || ''))
          setOldPassword('')
          setPassword('')
          setPasswordConfirm('')
          const currentAvatarUrl =
            user.avatarUrl || (user.avatar ? pb.files.getURL(user, user.avatar) : null)
          setAvatarPreview(currentAvatarUrl)
          setAvatarFile(null)
          setRemoveAvatar(false)
          setShowPassword(false)
          setShowPasswordConfirm(false)
          setIsSaving(false)
        }
      }
    }
    fetchLatestUser()
  }, [open, user?.id])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
      setRemoveAvatar(false)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview(null)
    setAvatarFile(null)
    setRemoveAvatar(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!user) return

    const pass = password.trim()
    const confirm = passwordConfirm.trim()

    if (pass && pass !== confirm) {
      toast({
        title: 'Erro de validação',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      })
      return
    }

    if (pass && !oldPassword.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'Para alterar sua senha, informe a senha atual.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const payload: any = {
        name: name.trim(),
        phone: phone,
      }

      if (pass) {
        payload.oldPassword = oldPassword.trim()
        payload.password = pass
        payload.passwordConfirm = confirm
      }

      if (avatarFile) {
        payload.avatar = avatarFile
      } else if (removeAvatar) {
        payload.avatar = ''
      }

      const updatedRecord = await pb.collection('users').update(user.id, payload)

      // Se a senha foi alterada, o token atual é invalidado pelo PocketBase. Precisamos refazer o login silenciosamente.
      if (pass) {
        await pb.collection('users').authWithPassword(user.email, pass)
      } else {
        pb.authStore.save(pb.authStore.token, updatedRecord)
      }

      toast({ title: 'Sucesso', description: 'Perfil atualizado com sucesso!' })
      onOpenChange(false)
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        const messages = Object.entries(fieldErrors)
          .map(([field, msg]) => {
            if (field === 'oldPassword') return 'Senha atual incorreta.'
            return `${field}: ${msg}`
          })
          .join(' | ')
        toast({
          title: 'Erro de validação',
          description: messages,
          variant: 'destructive',
        })
      } else {
        const serverMessage = error.response?.message || error.message
        toast({
          title: 'Erro ao salvar',
          description: serverMessage || 'Erro inesperado.',
          variant: 'destructive',
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !isSaving && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Meu Perfil</DialogTitle>
          <DialogDescription>Atualize suas informações pessoais e senha.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-20 w-20 border shadow-sm">
              {avatarPreview ? (
                <AvatarImage src={avatarPreview} className="object-cover aspect-square" />
              ) : (
                <AvatarFallback>
                  {(name || user?.email || '?').charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
              >
                <Upload className="w-4 h-4 mr-2" />
                Foto
              </Button>
              {avatarPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  className="text-destructive"
                  disabled={isSaving}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label>E-mail (Login)</Label>
            <Input value={user?.email || ''} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Ana Silva"
              autoComplete="name"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              autoComplete="tel"
              disabled={isSaving}
            />
          </div>

          <div className="pt-4 border-t border-border/50">
            <h4 className="text-sm font-medium mb-3">Alterar Senha</h4>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Senha Atual</Label>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                    autoComplete="new-password"
                    disabled={isSaving}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-foreground hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSaving}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {password.length > 0 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label>Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      type={showPasswordConfirm ? 'text' : 'password'}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10"
                      autoComplete="new-password"
                      disabled={isSaving}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-foreground hover:bg-transparent"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      disabled={isSaving}
                    >
                      {showPasswordConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || (password.length > 0 && password !== passwordConfirm)}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
