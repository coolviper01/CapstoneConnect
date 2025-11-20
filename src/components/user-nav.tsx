
'use client';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFirebase } from "@/firebase"
import { User, LogOut } from "lucide-react"
import { Skeleton } from "./ui/skeleton";
import { useRouter } from "next/navigation";

export function UserNav() {
  const { user, isUserLoading, handleSignOut } = useFirebase();
  const router = useRouter();

  if (isUserLoading) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }
  
  const getDisplayName = () => {
    if (user?.isAnonymous) return 'Anonymous User';
    return user?.displayName || 'User';
  }
  
  const getDisplayEmail = () => {
    if (user?.isAnonymous) return `UID: ${user.uid.substring(0, 8)}...`;
    return user?.email || 'No email';
  }

  const performSignOut = () => {
    handleSignOut().then(() => {
      router.push('/');
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            {user?.photoURL && <AvatarImage src={user.photoURL} alt={getDisplayName()} />}
            <AvatarFallback>
                <User />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {getDisplayEmail()}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={performSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
