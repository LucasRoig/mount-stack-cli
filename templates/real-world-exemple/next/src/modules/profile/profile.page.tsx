import { Avatar, AvatarFallback, AvatarImage } from "@lro-ui/avatar";
import { Button } from "@lro-ui/button";
import { UserRoundPenIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { getAuth } from "@/lib/auth/auth";
import { Routes } from "@/routes";

export async function ProfilePage(props: PageProps<"/profile/[username]">) {
  const { username } = await props.params;
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });
  const isMe = session?.user.name === username;

  return (
    <div>
      <ProfilePageHero username={username} isMe={isMe} />
      <Feed />
    </div>
  );
}

function ProfilePageHero(props: { username: string; isMe: boolean }) {
  const initials = props.username.slice(0, 2).toUpperCase();
  return (
    <div className="border-b p-8 pb-4 mb-8">
      <Container className="text-center">
        <Avatar className="size-20 rounded-full mx-auto mb-4">
          <AvatarImage src="/default-avatar.svg" alt="user-avatar" />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold mb-2">{props.username}</h1>
        {props.isMe && (
          <div className="text-right">
            <Button variant="secondary" size="xs" asChild>
              <Link href={Routes.settings} data-testid="profile-page-edit-profile-link">
                <UserRoundPenIcon />
                Edit Profile
              </Link>
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}

function Feed() {
  return (
    <Container>
      <div className="bg-red-300">Feed</div>
    </Container>
  );
}
