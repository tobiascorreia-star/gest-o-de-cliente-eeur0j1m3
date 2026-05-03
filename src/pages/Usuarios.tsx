import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Mail,
  Shield,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Upload,
  Trash2,
  Power,
  PowerOff,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { logAudit } from '@/services/audit'
import { ErrorBoundary } from '@/components/error-boundary'
import { useApp } from '@/contexts/app-context'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

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

export default function Usuarios() {
  const { users, addUser, updateUser } = useApp()
  const [isOpen, setIsOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [accessUser, setAccessUser] = useState<any>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [phone, setPhone] = useState('')
  const [active, setActive] = useState(true)
  const [role, setRole] = useState<'admin' | 'operator'>('operator')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const openForm = (u?: any) => {
    if (u) {
      setEditingUser(u)
      setName(u.name || '')
      setEmail(u.email || '')
      setPhone(formatPhone(u.phone || ''))
      setActive(u.active !== false)
      setPassword('')
      setPasswordConfirm('')
      setRole((u.role as any) || 'operator')
      setAvatarPreview(u.avatarUrl || null)
      setAvatarFile(null)
    } else {
      setEditingUser(null)
      setName('')
      setEmail('')
      setPhone('')
      setActive(true)
      setPassword('')
      setPasswordConfirm('')
      setRole('operator')
      setAvatarPreview(null)
      setAvatarFile(null)
    }
    setShowPassword(false)
    setShowPasswordConfirm(false)
    setIsSaving(false)
    setIsOpen(true)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview(null)
    setAvatarFile(null)
  }

  const handleSave = async () => {
    const pass = password.trim()
    const confirm = passwordConfirm.trim()

    if (!name.trim() || !email.trim() || !role || (!editingUser && !pass)) {
      toast({
        title: 'Erro de validação',
        description:
          'Por favor, preencha todos os campos obrigatórios (Nome, E-mail, Perfil' +
          (!editingUser ? ' e Senha' : '') +
          ').',
        variant: 'destructive',
      })
      return
    }

    if (pass && pass !== confirm) {
      toast({
        title: 'Erro de validação',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      const userData: any = {
        name: name.trim(),
        email: email.trim(),
        role,
        phone,
        active,
      }

      if (pass) {
        userData.password = pass
        userData.passwordConfirm = pass
      }

      if (avatarFile) {
        userData.avatar = avatarFile
      } else if (!avatarPreview && editingUser?.avatar) {
        userData.avatar = null
      }

      if (editingUser) {
        const record = await pb.collection('users').update(editingUser.id, userData)
        updateUser(record)
        logAudit('UPDATE_USER', `Usuário ${email} atualizado.`)
        toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso!' })
      } else {
        const record = await pb.collection('users').create(userData)
        addUser(record)
        logAudit('CREATE_USER', `Usuário ${email} criado.`)
        toast({ title: 'Sucesso', description: 'Novo usuário criado!' })
      }

      setIsOpen(false)
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        const messages = Object.entries(fieldErrors)
          .map(([field, msg]) => {
            if (field === 'email' && msg.toLowerCase().includes('unique')) {
              return 'Este e-mail já está em uso por outro usuário.'
            }
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
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async (user: any) => {
    try {
      const record = await pb.collection('users').update(user.id, { active: !user.active })
      updateUser(record)
      logAudit(
        'TOGGLE_USER_STATUS',
        `Status do usuário ${user.email} alterado para ${!user.active ? 'Ativo' : 'Inativo'}`,
      )
      toast({
        title: 'Sucesso',
        description: `Usuário ${!user.active ? 'ativado' : 'inativado'} com sucesso.`,
      })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar status.',
        variant: 'destructive',
      })
    }
  }

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Usuários</h2>
            <p className="text-muted-foreground text-sm">Equipe com acesso ao sistema.</p>
          </div>
          <Button onClick={() => openForm()}>
            <Plus className="w-4 h-4 mr-2" /> Novo Usuário
          </Button>
        </div>

        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-muted/20">
            <p className="text-muted-foreground mb-4">Nenhum usuário encontrado.</p>
            <Button onClick={() => openForm()} variant="outline">
              Adicionar Primeiro Usuário
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <Card
                key={user.id}
                className={`overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow relative ${user.active === false ? 'opacity-80' : ''}`}
              >
                {user.active === false && (
                  <div className="absolute top-2 right-2 flex items-center justify-center">
                    <Badge variant="destructive" className="text-[10px] shadow-sm">
                      Inativo
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <Avatar
                      className={`h-12 w-12 border-2 border-background shadow-sm ${user.active === false ? 'grayscale' : ''}`}
                    >
                      <AvatarImage
                        src={
                          user?.avatarUrl
                            ? user.avatarUrl
                            : `https://img.usecurling.com/ppl/thumbnail?seed=${user?.id || 'default'}`
                        }
                      />
                      <AvatarFallback>
                        {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Badge
                      variant={user.role?.toLowerCase() === 'admin' ? 'default' : 'secondary'}
                      className="text-[10px]"
                    >
                      {user.role?.toLowerCase() === 'admin' ? 'Administrador' : 'Operador'}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-semibold text-lg leading-tight truncate">
                      {user.name || 'Sem nome'}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground mt-1 gap-2">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setAccessUser(user)}
                    >
                      <Shield className="w-4 h-4 mr-2" /> Acessos
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => openForm(user)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={user.active !== false ? 'secondary' : 'default'}
                      size="sm"
                      onClick={() => handleToggleStatus(user)}
                      title={user.active !== false ? 'Inativar Usuário' : 'Ativar Usuário'}
                      className={
                        user.active !== false
                          ? 'text-destructive hover:text-destructive hover:bg-destructive/10'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }
                    >
                      {user.active !== false ? (
                        <PowerOff className="w-4 h-4" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isOpen} onOpenChange={(v) => !isSaving && setIsOpen(v)}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
              <DialogDescription>Preencha os dados do usuário.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-20 w-20 border shadow-sm">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} />
                  ) : (
                    <AvatarFallback>
                      {(name || email || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Foto
                  </Button>
                  {avatarPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      className="text-destructive"
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
                />
              </div>

              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Ana Silva"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail (Login) *</Label>
                <Input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@gestao.com"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  type="tel"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-foreground hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {(!editingUser || password.length > 0) && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label>Confirmar {editingUser ? 'Nova ' : ''}Senha *</Label>
                  <div className="relative">
                    <Input
                      type={showPasswordConfirm ? 'text' : 'password'}
                      name="passwordConfirm"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10"
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-foreground hover:bg-transparent"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
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
              <div className="space-y-2">
                <Label>Perfil de Acesso *</Label>
                <Select value={role} onValueChange={(v: 'admin' | 'operator') => setRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador (Acesso Total)</SelectItem>
                    <SelectItem value="operator">Operador (Acesso Restrito)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="active-user" checked={active} onCheckedChange={setActive} />
                <Label htmlFor="active-user" className="cursor-pointer">
                  Usuário Ativo
                </Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
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

        <Dialog open={!!accessUser} onOpenChange={(open) => !open && setAccessUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurações de Acesso - {accessUser?.name || 'Usuário'}</DialogTitle>
              <DialogDescription>
                Detalhes de segurança e histórico de acessos para este usuário.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="p-3 bg-muted rounded-md text-sm">
                <div className="flex justify-between items-center border-b border-border/50 pb-2 mb-2">
                  <span className="text-muted-foreground">Status da Conta</span>
                  {accessUser?.active === false ? (
                    <Badge variant="destructive" className="border-none">
                      Inativa
                    </Badge>
                  ) : (
                    <Badge
                      variant="default"
                      className="bg-emerald-500 hover:bg-emerald-600 border-none"
                    >
                      Ativa
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Perfil</span>
                  <span className="font-medium capitalize">{accessUser?.role || '-'}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setAccessUser(null)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  )
}
