"use client";
import { Button } from "@lro-ui/button";
import { FieldGroup, FieldSeparator } from "@lro-ui/field";
import { useAppForm } from "@lro-ui/form";
import { toast } from "@lro-ui/sonner";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import z from "zod";
import { signUp } from "@/lib/auth/auth-client";
import { type AuthError, AuthErrorField } from "./auth-error-field";

//TODO: Make a custom password field with strenght indicator to show to extend the app form declared in the design system with new components.

const signUpFormSchema = z
  .object({
    username: z.string().min(3),
    email: z.email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const formDefaultValues = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function SignUpForm() {
  const [globalError, setGlobalError] = useState<AuthError>();
  const router = useRouter();
  const form = useAppForm({
    defaultValues: formDefaultValues,
    validators: {
      onSubmit: signUpFormSchema,
    },
    onSubmit: async ({ value }) => {
      setGlobalError(undefined);
      const { error } = await signUp.email({
        email: value.email,
        password: value.password,
        name: value.username,
      });
      if (error) {
        console.log(error);
        setGlobalError(error);
      } else {
        router.push("/");
        router.refresh();
        toast.success("Your account has been created successfully!");
      }
    },
  });
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form.AppForm>
      <form.FormRoot ref={formRef}>
        <FieldGroup>
          <form.AppField name="username">
            {(field) => <field.TextField label="Username" autoComplete="username" />}
          </form.AppField>
          <form.AppField name="email">
            {(field) => <field.TextField label="Email" autoComplete="email" />}
          </form.AppField>
          <form.AppField name="password">
            {(field) => (
              <field.TextField
                type="password"
                label="Password"
                description="Must be at least 8 characters long."
                autoComplete="new-password"
              />
            )}
          </form.AppField>
          <form.AppField name="confirmPassword">
            {(field) => (
              <field.TextField
                type="password"
                label="Confirm Password"
                description="Please confirm your password."
                autoComplete="new-password"
              />
            )}
          </form.AppField>
          <AuthErrorField error={globalError} />
          <form.SubmitButton>Create your account</form.SubmitButton>
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
