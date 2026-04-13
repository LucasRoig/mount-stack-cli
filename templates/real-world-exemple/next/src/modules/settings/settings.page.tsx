import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { getAuth } from "@/lib/auth/auth";
import { Routes } from "@/routes";
import { PasswordForm } from "./password.form";
import { ProfileForm } from "./profile.form";

export async function SettingsPage(_props: PageProps<"/settings">) {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(Routes.auth.signIn);
  }

  return (
    <Container className="w-full" maxWidth="sm">
      <div className="mt-6 w-full pb-4">
        <div className="pb-2 border-b mb-4">
          <h1 className="text-xl">Your Profile</h1>
        </div>
        <ProfileForm
          defaultValues={{
            username: session?.user.name,
            bio: "",
            pictureUrl: session?.user.image ?? undefined,
          }}
        />
      </div>
      <div className="w-full mt-10">
        <div className="pb-2 border-b mb-4">
          <h1 className="text-xl">Change your password</h1>
        </div>
        <PasswordForm />
      </div>
    </Container>
  );
}
