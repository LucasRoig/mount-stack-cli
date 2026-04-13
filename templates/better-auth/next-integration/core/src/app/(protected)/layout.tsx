import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/auth";
import { Routes } from "@/routes";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });
  console.log("Session in layout:", session);
  if (!session) {
    redirect(Routes.auth.signIn);
  }
  return <>{children}</>;
}
