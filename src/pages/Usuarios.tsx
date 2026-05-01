import { useApp } from '@/contexts/app-context'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, Shield } from 'lucide-react'

const Usuarios = () => {
  const { users } = useApp()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Usuários</h2>
          <p className="text-muted-foreground text-sm">Equipe com acesso ao sistema.</p>
        </div>
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
                  {user.role}
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Usuarios
