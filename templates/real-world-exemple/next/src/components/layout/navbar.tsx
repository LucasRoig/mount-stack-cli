import { Button } from "@lro-ui/button";
import Link from "next/link";
import { Container } from "./container";

export function Navbar() {
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
        </div>
      </nav>
    </Container>
  );
}
