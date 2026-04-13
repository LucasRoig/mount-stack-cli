"use client";
import { Button } from "@lro-ui/button";
import { FieldGroup, FieldSeparator } from "@lro-ui/field";
import { useAppForm } from "@lro-ui/form";
import { toast } from "@lro-ui/sonner";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import z from "zod";
import { AuthErrorField, type AuthError } from "./auth-error-field";
import { signIn } from "@/lib/auth/auth-client";

const signInFormSchema = z.object({
  email: z.email(),
  password: z.string().nonempty("Please enter your password"),
});

const formDefaultValues = {
  email: "",
  password: "",
};

export function SignInForm() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<AuthError>();
  const form = useAppForm({
    defaultValues: formDefaultValues,
    validators: {
      onSubmit: signInFormSchema,
    },
    onSubmit: async ({ value }) => {
      setGlobalError(undefined);
      const { error } = await signIn.email({
        email: value.email,
        password: value.password
      });
      if (error) {
        console.log(error);
        setGlobalError(error);
      } else {
        router.push("/");
        router.refresh();
        toast.success("You have signed in successfully!");
      }
    },
  });
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form.AppForm>
      <form.FormRoot ref={formRef}>
        <FieldGroup>
          <form.AppField name="email">{(field) => <field.TextField label="Email" />}</form.AppField>
          <form.AppField name="password">{(field) => <field.TextField label="Password" type="password" />}</form.AppField>
          <AuthErrorField error={globalError} />
          <form.SubmitButton>Sign In</form.SubmitButton>
          <FieldSeparator>Or</FieldSeparator>
          <div className="flex flex-col gap-4">
            <Button variant="secondary" type="button">
              Continue with OIDC
            </Button>
            <Button variant="secondary" type="button">
              Continue with SAML
            </Button>
          </div>
        </FieldGroup>
      </form.FormRoot>
    </form.AppForm>
  );
}
