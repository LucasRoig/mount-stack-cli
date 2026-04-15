import { Button } from "@lro-ui/button";
import { SquarePenIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { getAuth } from "@/lib/auth/auth";
import { Routes } from "@/routes";
import { Container } from "./container";
import { UserMenu } from "./user-menu";

export async function Navbar() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  return (
    <Container asChild className="h-full flex items-center" data-testid="app-header">
      <nav>
        <Link href={Routes.homepage} className="text-2xl">
          Conduit
        </Link>
        <div className="ml-auto flex gap-4 items-center">
          <Link
            href={Routes.homepage}
            className="text-muted-foreground hover:text-foreground"
            data-testid="header-home-page-link"
          >
            Home
          </Link>
          {session ? (
            <AuthenticatedLinks username={session.user.name} email={session.user.email} />
          ) : (
            <NotAuthenticatedLinks />
          )}
        </div>
      </nav>
    </Container>
  );
}

function AuthenticatedLinks(props: { username: string; email: string }) {
  return (
    <>
      <Button variant="secondary" asChild>
        <Link href={Routes.editor} data-testid="header-new-article-link">
          <SquarePenIcon />
          New article
        </Link>
      </Button>
      <UserMenu username={props.username} email={props.email} />
    </>
  );
}

function NotAuthenticatedLinks() {
  return (
    <>
      <Link
        href={Routes.auth.signIn}
        className="text-muted-foreground hover:text-foreground"
        data-testid="header-sign-in-link"
      >
        Sign in
      </Link>
      <Button asChild>
        <Link href={Routes.auth.signUp} data-testid="header-sign-up-link">
          Sign up
        </Link>
      </Button>
    </>
  );
}
