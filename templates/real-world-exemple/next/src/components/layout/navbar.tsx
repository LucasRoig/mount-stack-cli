import { Button } from "@lro-ui/button";
import { headers } from "next/headers";
import Link from "next/link";
import { getAuth } from "@/lib/auth/auth";
import { Container } from "./container";

export async function Navbar() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  return (
    <Container asChild className="h-full flex items-center" data-testid="app-header">
      <nav>
        <Link href="/" className="text-2xl">
          Conduit
        </Link>
        <div className="ml-auto flex gap-4 items-center">
          <Link href="/" className="text-muted-foreground hover:text-foreground" data-testid="header-home-page-link">
            Home
          </Link>
          {!session && (
            <>
              <Link
                href="/auth/sign-in"
                className="text-muted-foreground hover:text-foreground"
                data-testid="header-sign-in-link"
              >
                Sign in
              </Link>
              <Button asChild>
                <Link href="/auth/sign-up" data-testid="header-sign-up-link">
                  Sign up
                </Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </Container>
  );
}
