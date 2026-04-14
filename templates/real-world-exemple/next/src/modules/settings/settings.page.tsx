import { isDefinedError } from "@orpc/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { match } from "ts-pattern";
import { NotFound } from "@/components/error-pages/not-found";
import { UnexpectedError } from "@/components/error-pages/unexpected-error";
import { Container } from "@/components/layout/container";
import { getAuth } from "@/lib/auth/auth";
import { getServerSideORPCClient } from "@/lib/orpc/orpc-server-side-client";
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

  const [error, profile] = await (await getServerSideORPCClient()).getUserProfile({
    username: session.user.name,
  });

  if (error) {
    if (isDefinedError(error)) {
      return match(error)
        .with({ code: "NOT_FOUND" }, () => <NotFound />)
        .exhaustive();
    } else {
      return <UnexpectedError />;
    }
  }

  return (
    <Container className="w-full my-6" maxWidth="sm">
      <div className="w-full pb-4">
        <div className="pb-2 border-b mb-4">
          <h1 className="text-xl">Your Profile</h1>
        </div>
        <ProfileForm
          defaultValues={{
            username: session.user.name,
            bio: profile.bio ?? "",
            pictureUrl: session.user.image ?? undefined,
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
