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
import { LogOut, User as UserIcon } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { ProfileDialog } from '../profile-dialog'
import { ModeToggle } from '@/components/mode-toggle'

export function AppHeader() {
  const { user, signOut } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  const avatarUrl =
    user?.avatarUrl ||
    (user?.avatar
      ? pb.files.getURL(user, user.avatar)
      : `https://img.usecurling.com/ppl/thumbnail?seed=${user?.id || 'default'}`)

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center gap-4 border-b border-slate-100 bg-white/50 backdrop-blur-md px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-950/50">
      <SidebarTrigger className="shrink-0" />

      <div className="flex flex-1 items-center justify-end gap-2">
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 outline-none hover:opacity-80 transition-opacity">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'Usuário'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email || ''}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  )
}
