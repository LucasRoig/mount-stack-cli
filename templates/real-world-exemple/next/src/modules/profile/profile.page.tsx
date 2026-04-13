import { Button } from "@lro-ui/button";
import { UserRoundPenIcon } from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { getAuth } from "@/lib/auth/auth";

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
  return (
    <div className="border-b p-8 pb-4 mb-8">
      <Container className="text-center">
        <Image
          src="/default-avatar.svg"
          alt="user avatar"
          width={100}
          height={100}
          className="rounded-full mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold mb-2">{props.username}</h1>
        {props.isMe && (
          <div className="text-right">
            <Button variant="secondary" size="xs" asChild>
              <Link href="/settings">
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
