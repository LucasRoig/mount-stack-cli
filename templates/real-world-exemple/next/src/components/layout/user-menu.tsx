"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@lro-ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@lro-ui/dropdown-menu";
import { ChevronDownIcon, CircleUserRoundIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/auth-client";
import { Routes } from "@/routes";

export function UserMenu(props: { username: string; email: string }) {
  const router = useRouter();
  const initials = props.username.slice(0, 2).toUpperCase();

  const onSignOut = async () => {
    await signOut();
    router.push(Routes.homepage);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 cursor-pointer transition-colors hover:bg-accent"
          data-testid="user-menu-trigger"
        >
          <Avatar className="size-8">
            <AvatarImage src="/default-avatar.svg" alt="user-avatar" />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground">{props.username}</span>
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg">
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src="/default-avatar.svg" alt="user-avatar" />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{props.username}</span>
              <span className="truncate text-xs text-muted-foreground">{props.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href={Routes.profile(props.username)} data-testid="user-menu-profile-link">
          <DropdownMenuItem>
            <CircleUserRoundIcon />
            Profile
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} data-testid="user-menu-sign-out-button">
          <LogOutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
