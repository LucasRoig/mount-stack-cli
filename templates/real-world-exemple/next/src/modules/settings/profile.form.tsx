"use client";

import { FieldGroup } from "@lro-ui/field";
import { useAppForm, useFocusFirstInvalidField } from "@lro-ui/form";
import { toast } from "@lro-ui/sonner";
import { isDefinedError } from "@orpc/server";
import { UpdateMyProfileSchema } from "@repo/api/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { match } from "ts-pattern";
import type z from "zod";
import { orpc } from "@/lib/orpc/orpc-link";

const profileFormSchema = UpdateMyProfileSchema;

type ProfileFormProps = {
  defaultValues: z.infer<typeof profileFormSchema>;
};

export function ProfileForm(props: ProfileFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const mutation = useMutation(orpc.updateMyProfile.mutationOptions());
  const queryClient = useQueryClient();
  const router = useRouter();
  const focusFirstInvalidField = useFocusFirstInvalidField(formRef);
  const form = useAppForm({
    defaultValues: props.defaultValues,
    validators: {
      onSubmit: profileFormSchema,
    },
    onSubmitInvalid: () => {
      focusFirstInvalidField();
    },
    onSubmit: ({ value }) => {
      mutation.mutate(value, {
        onSuccess: () => {
          queryClient.invalidateQueries(); //Invalidate all queries, the username might have changed so we don't know which query is affected
          router.refresh();
          toast.success("Profile updated successfully.");
        },
        onError: (err) => {
          if (isDefinedError(err)) {
            match(err)
              .with({ code: "INPUT_VALIDATION_FAILED" }, (err) => {
                form.setErrorMap({
                  onSubmit: {
                    form: err.data.formErrors,
                    fields: err.data.fieldErrors,
                  },
                });
              })
              .with({ code: "USERNAME_ALREADY_TAKEN" }, () => {
                form.setErrorMap({
                  onSubmit: {
                    fields: {
                      username: "This username is already taken",
                    },
                  },
                });
              })
              .exhaustive();
            focusFirstInvalidField();
            return;
          }
          toast.error("An unexpected error occurred. Please try again.");
        },
      });
    },
  });

  return (
    <form.AppForm>
      <form.FormRoot ref={formRef}>
        <FieldGroup>
          <form.AppField name="username">
            {(field) => <field.TextField label="Username" placeholder="Username" />}
          </form.AppField>
          <form.AppField name="pictureUrl">
            {(field) => <field.TextField label="Picture URL" placeholder="URL of profile picture" />}
          </form.AppField>
          <form.AppField name="bio">
            {(field) => <field.TextAreaField label="Bio" maxLength={500} placeholder="Short bio about you" />}
          </form.AppField>
          <div>
            <form.SubmitButton>Update Profile</form.SubmitButton>
          </div>
        </FieldGroup>
      </form.FormRoot>
    </form.AppForm>
  );
}
