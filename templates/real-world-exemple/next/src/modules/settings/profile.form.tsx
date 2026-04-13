"use client";

import { FieldGroup } from "@lro-ui/field";
import { useAppForm } from "@lro-ui/form";
import { useRef } from "react";
import z from "zod";

const profileFormSchema = z.object({
  username: z.string().min(3).max(16),
  pictureUrl: z.url().optional(),
  bio: z.string().max(500).optional(),
});

type ProfileFormProps = {
  defaultValues: z.infer<typeof profileFormSchema>;
}

export function ProfileForm(props: ProfileFormProps) {
  const form = useAppForm({
    defaultValues: props.defaultValues,
    validators: {
      onSubmit: profileFormSchema,
    },
    onSubmit: ({ value }) => {
      console.log(value);
    },
  })
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form.AppForm>
      <form.FormRoot ref={formRef}>
        <FieldGroup>
          <form.AppField name="username">{(field) =>
            <field.TextField label="Username" placeholder="Username" />
          }</form.AppField>
          <form.AppField name="pictureUrl">{(field) =>
            <field.TextField label="Picture URL" placeholder="URL of profile picture" />
          }</form.AppField>
          <form.AppField name="bio">{(field) =>
            <field.TextAreaField label="Bio" maxLength={500} placeholder="Short bio about you" />
          }</form.AppField>
          <div>
            <form.SubmitButton>Update Profile</form.SubmitButton>
          </div>
        </FieldGroup>
      </form.FormRoot>
    </form.AppForm>
  );
}
