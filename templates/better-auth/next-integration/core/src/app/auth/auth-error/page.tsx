
//original code for error page: https://github.com/better-auth/better-auth/blob/b8febc247741868ca048107fdf1dfde65627c9de/packages/better-auth/src/api/routes/error.ts#L259

//Pour tester l'erreur: http://localhost:3000/api/auth/callback/local-oidc?error=access_denied
import Link from "next/link";

function sanitize(input: string): string {
  // Repris directement de la fonction sanitize de better-auth
  // Replace & last to avoid double-encoding existing HTML entities
  // Match & only when it's not already part of an HTML entity
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/&(?!amp;|lt;|gt;|quot;|#39;|#x[0-9a-fA-F]+;|#[0-9]+;)/g, "&amp;");
}

export default async function AuthErrorPage(props: PageProps<'/auth-error'>) {
  const {
    error: unsanitizedCode,
    error_description: unsanitizedDescription
  } = await props.searchParams;
  const isValid = /^[\'A-Za-z0-9_-]+$/.test(typeof unsanitizedCode === "string" ? unsanitizedCode : "");
  const safeCode = isValid ? sanitize(unsanitizedCode as string) : "UNKNOWN";
  const safeDescription = typeof unsanitizedDescription === "string"
    ? sanitize(unsanitizedDescription)
    : null;

  return (
    <div>
      <h1>Authentication Error</h1>
      <p>Code: {safeCode}</p>
      {safeDescription && <p>Description: {safeDescription}</p>}
      <p>An error occurred during authentication. Please try again.</p>
      <Link href="/">Go back</Link>
    </div>
  )
}
