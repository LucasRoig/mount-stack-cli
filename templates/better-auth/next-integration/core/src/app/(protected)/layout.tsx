import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  console.log("Session in layout:", session);
  if (!session) {
    redirect("/sign-in");
  }
  return <>{children}</>;
}
