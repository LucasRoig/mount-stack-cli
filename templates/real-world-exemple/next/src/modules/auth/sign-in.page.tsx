import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { getAuth } from "@/lib/auth/auth";
// import { type $ERROR_CODES, signIn, signUp } from "@/lib/auth/auth-client";
import { SignInForm } from "./sign-in.form";

// type ErrorTypes = Partial<Record<keyof typeof $ERROR_CODES, string>>;

//TODO: On rencontre une erreur à travers le provider OIDC lorsque l'utilisateur s'est déjà connecté une fois avec un autre provider
//L'utilisateur est redirigé vers /?error=account_not_linked sans la moindre erreur ou message.

export async function SigninPage() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (session) {
    return redirect("/");
  }
  return (
    <Container className="my-6 w-full px-4" maxWidth="sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold" data-testid="sign-in-page-title">
          Login to your account
        </h1>
        <p className="text-sm text-balance text-muted-foreground">Enter your email below to login to your account</p>
      </div>
      <div className="mt-6 w-full">
        <SignInForm />
      </div>
    </Container>
  );
}

// function SignInBlock() {
//   const getErrorMessage = useGetAuthErrorMessage();
//   const router = useRouter();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     const { data: _data, error } = await signIn.email({
//       email: email,
//       password: password,
//     });
//     if (error?.code) {
//       alert(getErrorMessage(error.code));
//     } else {
//       router.push("/");
//     }
//   };
//   const handleSSOLogin = async (args: { providerId: string; providerKind: "oidc" | "saml"; forceLogin?: boolean }) => {
//     const { error } = await signIn.sso({
//       providerId: args.providerId,
//       callbackURL: "/",
//       errorCallbackURL: "/sign-in",
//       newUserCallbackURL: "/bliblu",
//       fetchOptions: {
//         query: {
//           forceLogin: args.forceLogin ? "true" : "false",
//           providerKind: args.providerKind,
//         },
//       },
//     });
//     if (error?.code) {
//       alert(getErrorMessage(error.code));
//     } else {
//       router.push("/");
//     }
//   };
//   const handleOIDCLogin = (providerId: string) =>
//     handleSSOLogin({ providerId, providerKind: "oidc", forceLogin: true });
//   const handleSAMLLogin = (providerId: string) =>
//     handleSSOLogin({ providerId, providerKind: "saml", forceLogin: true });
//   return (
//     <div>
//       <form onSubmit={handleSubmit}>
//         <div className="flex gap-2">
//           <label htmlFor="email">Email</label>
//           <input
//             type="email"
//             name="email"
//             className="border"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//           />
//         </div>
//         <div className="flex gap-2">
//           <label htmlFor="password">Password</label>
//           <input
//             type="password"
//             name="password"
//             className="border"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//           />
//         </div>
//         <button className="border px-2" type="submit">
//           Submit
//         </button>
//       </form>
//       <button className="border px-2" type="button" onClick={() => handleOIDCLogin("local-oidc")}>
//         Signin with OIDC
//       </button>
//       <button className="border px-2" type="button" onClick={() => handleSAMLLogin("local-saml")}>
//         Signin with SAML
//       </button>
//     </div>
//   );
// }
// function SignUpBlock() {
//   const signUpMutation = useMutation({
//     mutationFn: async (form: { firstName: string; lastName: string; email: string; password: string }) => {
//       const { data, error } = await signUp.email({
//         name: `${form.firstName} ${form.lastName}`,
//         email: form.email,
//         password: form.password,
//       });
//       if (error) {
//         throw new Error(JSON.stringify(error));
//       }
//       return data;
//     },
//   });
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");

//   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     signUpMutation.mutate(
//       { firstName, lastName, email, password },
//       {
//         onSuccess: () => alert("User created successfully"),
//         onError: (err) => alert(`Error while creating user : ${err instanceof Error ? err.message : "Unknown error"}`),
//       },
//     );
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <div className="flex gap-2">
//         <label htmlFor="name">First Name</label>
//         <input
//           type="text"
//           name="name"
//           className="border"
//           value={firstName}
//           onChange={(e) => setFirstName(e.target.value)}
//         />
//       </div>
//       <div className="flex gap-2">
//         <label htmlFor="name">Last Name</label>
//         <input
//           type="text"
//           name="name"
//           className="border"
//           value={lastName}
//           onChange={(e) => setLastName(e.target.value)}
//         />
//       </div>
//       <div className="flex gap-2">
//         <label htmlFor="email">Email</label>
//         <input type="email" name="email" className="border" value={email} onChange={(e) => setEmail(e.target.value)} />
//       </div>
//       <div className="flex gap-2">
//         <label htmlFor="password">Password</label>
//         <input
//           type="password"
//           name="password"
//           className="border"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//         />
//       </div>
//       <div className="flex gap-2">
//         <label htmlFor="confirmPassword">Confirm Password</label>
//         <input
//           type="password"
//           name="confirmPassword"
//           className="border"
//           value={confirmPassword}
//           onChange={(e) => setConfirmPassword(e.target.value)}
//         />
//       </div>
//       <button className="border px-2" type="submit">
//         Submit
//       </button>
//     </form>
//   );
// }
