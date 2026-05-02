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

const MOCK_USERS = [
  {
    id: 'u1',
    name: 'Administrador',
    email: 'tobiascorreia@gmail.com',
    role: 'admin',
    active: true,
    phone: '(11) 99999-9999',
    created: new Date().toISOString(),
    avatar: null,
  },
  {
    id: 'u2',
    name: 'Operador Padrão',
    email: 'operador@gestao.com',
    role: 'operator',
    active: true,
    phone: '(11) 88888-8888',
    created: new Date().toISOString(),
    avatar: null,
  },
]

export default function Usuarios() {
  const [users, setUsers] = useState<any[]>(MOCK_USERS)
  const [isOpen, setIsOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [accessUser, setAccessUser] = useState<any>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [active, setActive] = useState(true)
  const [role, setRole] = useState<'admin' | 'operator'>('operator')
  const [showPassword, setShowPassword] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const openForm = (u?: any) => {
    if (u) {
      setEditingUser(u)
      setName(u.name || '')
      setEmail(u.email || '')
      setPhone(formatPhone(u.phone || ''))
      setActive(u.active !== false)
      setPassword('')
      setRole(u.role || 'operator')
      setAvatarPreview(u.avatar || null)
    } else {
      setEditingUser(null)
      setName('')
      setEmail('')
      setPhone('')
      setActive(true)
      setPassword('')
      setRole('operator')
      setAvatarPreview(null)
    }
    setShowPassword(false)
    setIsOpen(true)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview(null)
  }

  const handleSave = () => {
    if (!email || !role || (!editingUser && !password)) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    const payload = {
      name,
      email,
      role,
      phone,
      active,
      avatar: avatarPreview,
      updated: new Date().toISOString(),
    }

    if (editingUser) {
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...payload } : u)))
      logAudit('UPDATE_USER', `Usuário ${email} atualizado.`)
      toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso!' })
    } else {
      const newUser = {
        id: `u_${Date.now()}`,
        created: new Date().toISOString(),
        ...payload,
      }
      setUsers((prev) => [newUser, ...prev])
      logAudit('CREATE_USER', `Usuário ${email} criado.`)
      toast({ title: 'Sucesso', description: 'Novo usuário criado!' })
    }

    setIsOpen(false)
  }

  const handleToggleStatus = (user: any) => {
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, active: !user.active } : u)))
    logAudit(
      'TOGGLE_USER_STATUS',
      `Status do usuário ${user.email} alterado para ${!user.active ? 'Ativo' : 'Inativo'}`,
    )
    toast({
      title: 'Sucesso',
      description: `Usuário ${!user.active ? 'ativado' : 'inativado'} com sucesso.`,
    })
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
                className={`overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow relative ${!user.active ? 'opacity-80' : ''}`}
              >
                {!user.active && (
                  <div className="absolute top-2 right-2 flex items-center justify-center">
                    <Badge variant="destructive" className="text-[10px] shadow-sm">
                      Inativo
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <Avatar
                      className={`h-12 w-12 border-2 border-background shadow-sm ${!user.active ? 'grayscale' : ''}`}
                    >
                      <AvatarImage
                        src={
                          user?.avatar ||
                          `https://img.usecurling.com/ppl/thumbnail?seed=${user?.id || 'default'}`
                        }
                      />
                      <AvatarFallback>
                        {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Badge
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                      className="text-[10px]"
                    >
                      {user.role === 'admin' ? 'Administrador' : 'Operador'}
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
                      variant={user.active ? 'secondary' : 'default'}
                      size="sm"
                      onClick={() => handleToggleStatus(user)}
                      title={user.active ? 'Inativar Usuário' : 'Ativar Usuário'}
                      className={
                        user.active
                          ? 'text-destructive hover:text-destructive hover:bg-destructive/10'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }
                    >
                      {user.active ? (
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

        <Dialog open={isOpen} onOpenChange={(v) => setIsOpen(v)}>
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
                <Label>Nome Completo</Label>
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
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
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
                  <span className="text-muted-foreground">Criado em</span>
                  <span className="font-medium">
                    {accessUser?.created
                      ? new Date(accessUser.created).toLocaleDateString('pt-BR')
                      : '-'}
                  </span>
                </div>
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
