import { useState } from 'react'
import { useApp } from '@/contexts/app-context'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, Shield, Plus, Edit } from 'lucide-react'
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
import { User } from '@/types'
import { toast } from '@/hooks/use-toast'

export default function Usuarios() {
  const { users, addUser, updateUser } = useApp()
  const [isOpen, setIsOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'Admin' | 'Operator'>('Operator')

  const openForm = (u?: User) => {
    if (u) {
      setEditingUser(u)
      setName(u.name)
      setEmail(u.email)
      setPassword(u.password || '')
      setRole(u.role)
    } else {
      setEditingUser(null)
      setName('')
      setEmail('')
      setPassword('')
      setRole('Operator')
    }
    setIsOpen(true)
  }

  const handleSave = () => {
    if (!name || !email || (!editingUser && !password)) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    if (editingUser) {
      updateUser({
        ...editingUser,
        name,
        email,
        role,
        password: password || editingUser.password,
      })
      toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso!' })
    } else {
      addUser({
        name,
        email,
        role,
        password,
        avatarUrl: `https://img.usecurling.com/ppl/thumbnail?seed=${Date.now()}`,
      })
      toast({ title: 'Sucesso', description: 'Novo usuário criado!' })
    }
    setIsOpen(false)
  }

  return (
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <Card
            key={user.id}
            className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <Badge
                  variant={user.role === 'Admin' ? 'default' : 'secondary'}
                  className="text-[10px]"
                >
                  {user.role === 'Admin' ? 'Administrador' : 'Operador'}
                </Badge>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-lg leading-tight">{user.name}</h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1 gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <Button variant="outline" size="sm" className="w-full">
                  <Shield className="w-4 h-4 mr-2" /> Acessos
                </Button>
                <Button variant="secondary" size="sm" onClick={() => openForm(user)}>
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>
              Preencha os dados do usuário. O e-mail será usado para acesso ao sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ana Silva"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail (Login) *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@gestao.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Perfil de Acesso *</Label>
              <Select value={role} onValueChange={(v: 'Admin' | 'Operator') => setRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Administrador (Acesso Total)</SelectItem>
                  <SelectItem value="Operator">Operador (Acesso Restrito)</SelectItem>
                </SelectContent>
              </Select>
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
    </div>
  )
}
