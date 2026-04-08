"use client";
import { FieldGroup } from "@lro-ui/field";
import { useAppForm } from "@lro-ui/form";
import { useRef } from "react";
import z from "zod";

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
  const form = useAppForm({
    defaultValues: formDefaultValues,
    validators: {
      onSubmit: signUpFormSchema,
    },
  });
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form.AppForm>
      <form.FormRoot ref={formRef}>
        <FieldGroup>
          <form.AppField name="username">{(field) => <field.TextField label="Username" />}</form.AppField>
          <form.AppField name="email">{(field) => <field.TextField label="Email" />}</form.AppField>
          <form.AppField name="password">
            {(field) => <field.TextField label="Password" description="Must be at least 8 characters long." />}
          </form.AppField>
          <form.AppField name="confirmPassword">
            {(field) => <field.TextField label="Confirm Password" description="Please confirm your password." />}
          </form.AppField>
          <form.SubmitButton>Create your account</form.SubmitButton>
        </FieldGroup>
      </form.FormRoot>
    </form.AppForm>
  );
}
