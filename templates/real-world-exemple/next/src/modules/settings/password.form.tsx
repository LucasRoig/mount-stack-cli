"use client";

import { FieldGroup } from "@lro-ui/field";
import { useAppForm } from "@lro-ui/form";
import { toast } from "@lro-ui/sonner";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import z from "zod";
import { changePassword } from "@/lib/auth/auth-client";
import { type AuthError, AuthErrorField } from "../auth/auth-error-field";

const passwordFormSchema = z
  .object({
    currentPassword: z.string(),
    password: z.string().min(8).max(64),
    confirmPassword: z.string().min(8).max(64),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const defaultValues = {
  currentPassword: "",
  password: "",
  confirmPassword: "",
} satisfies z.infer<typeof passwordFormSchema>;

export function PasswordForm() {
  const [globalError, setGlobalError] = useState<AuthError>();
  const router = useRouter();
  const form = useAppForm({
    defaultValues: defaultValues,
    validators: {
      onSubmit: passwordFormSchema,
    },
    onSubmit: async ({ value }) => {
      setGlobalError(undefined);
      const { error } = await changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.password,
        revokeOtherSessions: true,
      });
      if (error) {
        setGlobalError(error);
      } else {
        toast.success("Your password has been changed successfully!");
        router.refresh();
        form.reset();
      }
    },
  });
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form.AppForm>
      <form.FormRoot ref={formRef}>
        <FieldGroup>
          <form.AppField name="currentPassword">
            {(field) => <field.TextField type="password" label="Current Password" autoComplete="current-password" />}
          </form.AppField>
          <form.AppField name="password">
            {(field) => (
              <field.TextField
                type="password"
                label="New Password"
                description="Must be at least 8 characters long."
                autoComplete="new-password"
              />
            )}
          </form.AppField>
          <form.AppField name="confirmPassword">
            {(field) => (
              <field.TextField
                type="password"
                label="Confirm New Password"
                description="Please confirm your new password."
                autoComplete="new-password"
              />
            )}
          </form.AppField>
          <AuthErrorField error={globalError} />
          <div>
            <form.SubmitButton>Change Password</form.SubmitButton>
          </div>
        </FieldGroup>
      </form.FormRoot>
    </form.AppForm>
  );
}
