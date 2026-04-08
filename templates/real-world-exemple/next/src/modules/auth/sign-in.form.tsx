"use client";
import { Button } from "@lro-ui/button";
import { FieldGroup, FieldSeparator } from "@lro-ui/field";
import { useAppForm } from "@lro-ui/form";
import { useRef } from "react";
import z from "zod";


const signInFormSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8),
  });

const formDefaultValues = {
  email: "",
  password: "",
};

export function SignInForm() {
  const form = useAppForm({
    defaultValues: formDefaultValues,
    validators: {
      onSubmit: signInFormSchema,
    },
  });
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form.AppForm>
      <form.FormRoot ref={formRef}>
        <FieldGroup>
          <form.AppField name="email">{(field) => <field.TextField label="Email" />}</form.AppField>
          <form.AppField name="password">
            {(field) => <field.TextField label="Password" />}
          </form.AppField>
          <form.SubmitButton>Sign In</form.SubmitButton>
          <FieldSeparator>Or</FieldSeparator>
          <div className="flex flex-col gap-4">
            <Button variant="secondary" type="button">Continue with OIDC</Button>
            <Button variant="secondary" type="button">Continue with SAML</Button>
          </div>
        </FieldGroup>
      </form.FormRoot>
    </form.AppForm>
  );
}
