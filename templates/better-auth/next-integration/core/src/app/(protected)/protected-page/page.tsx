"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth/auth-client";

export default function Page() {
  const session = useSession();
  const router = useRouter();
  const handleLogout = () => {
    signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/"); // redirect to login page
        },
      },
    });
  };
  return (
    <>
      <h1>Protected page</h1>
      <div>{JSON.stringify(session.data)}</div>
      <button className="border px-2" type="button" onClick={handleLogout}>
        Logout
      </button>
    </>
  );
}
