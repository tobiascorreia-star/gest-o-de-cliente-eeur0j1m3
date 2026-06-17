import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, User as UserIcon, ChevronDown } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { ProfileDialog } from '../profile-dialog'
import { ModeToggle } from '@/components/mode-toggle'
import { NewClientsAlert } from '@/components/new-clients-alert'
import { PayrollEducationAlert } from '@/components/payroll-education-alert'
import { PushNotificationButton } from '@/components/push-notification-button'
import { Badge } from '@/components/ui/badge'

export function AppHeader() {
  const { user, signOut } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  const avatarUrl =
    user?.avatarUrl ||
    (user?.avatar
      ? pb.files.getURL(user, user.avatar)
      : `https://img.usecurling.com/ppl/thumbnail?seed=${user?.id || 'default'}`)

  const isAdmin = user?.role?.toLowerCase() === 'admin'

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center gap-3 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 sm:px-6">
      <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground" />

      <div className="h-5 w-px bg-border/60 hidden sm:block" />

      <div className="flex flex-1 items-center justify-end gap-1.5">
        {/* Push notification toggle */}
        <PushNotificationButton />

        {/* Payroll education alert */}
        <PayrollEducationAlert />

        {/* Theme toggle */}
        <ModeToggle />

        <div className="h-5 w-px bg-border/60 mx-1" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 outline-none hover:opacity-90 transition-opacity rounded-full px-1 py-1 hover:bg-accent">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start leading-none">
                <span className="text-sm font-medium text-foreground leading-tight">
                  {user?.name?.split(' ')[0] || 'Usuário'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {isAdmin ? 'Administrador' : 'Operador'}
                </span>
              </div>
              <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-semibold leading-none">{user?.name || 'Usuário'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email || ''}</p>
                  <Badge
                    variant="outline"
                    className="w-fit text-[10px] mt-1 h-4 px-1.5"
                  >
                    {isAdmin ? 'Admin' : 'Operador'}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair do Sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <NewClientsAlert />
    </header>
  )
}
