import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { getAuth } from "@/lib/auth/auth";
import { SignUpForm } from "@/modules/auth/sign-up.form";
import { Routes } from "@/routes";

export async function SignUpPage() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (session) {
    return redirect(Routes.homepage);
  }
  return (
    <Container className="my-6 w-full px-4" maxWidth="sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold" data-testid="sign-up-page-title">
          Create your account
        </h1>
        <p className="text-sm text-balance text-muted-foreground">Fill in the form below to create your account</p>
      </div>
      <div className="mt-6 w-full">
        <SignUpForm />
      </div>
    </Container>
  );
}
