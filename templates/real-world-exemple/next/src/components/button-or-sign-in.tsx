"use client";
import { Button } from "@lro-ui/button";
import Link from "next/link";
import { useIsAuthenticated } from "@/lib/auth/auth-client";
import { Routes } from "@/routes";

/**
 * Base component to display a button that either performs an action if the user is authenticated,
 * or redirects to the sign-in page if not.
 */
export function ButtonOrSignIn({ children, ...buttonProps }: React.ComponentProps<typeof Button>) {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return (
      <Button {...buttonProps} asChild>
        <Link href={Routes.auth.signUp}>{children}</Link>
      </Button>
    );
  }

  return <Button {...buttonProps}>{children}</Button>;
}
