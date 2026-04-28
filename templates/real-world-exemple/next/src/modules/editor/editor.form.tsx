"use client";
import { FieldGroup } from "@lro-ui/field";
import { useAppForm, useFocusFirstInvalidField } from "@lro-ui/form";
import { toast } from "@lro-ui/sonner";
import { isDefinedError } from "@orpc/client";
import { ArticleSchema } from "@repo/api/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { match } from "ts-pattern";
import type z from "zod";
import { orpc } from "@/lib/orpc/orpc-link";

const formSchema = ArticleSchema;

const defaultValues = {
  title: "",
  description: "",
  body: "",
  tags: "",
} satisfies z.infer<typeof formSchema>;

export function EditorForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const createArticleMutation = useMutation(orpc.createArticle.mutationOptions());
  const focusFirstInvalidField = useFocusFirstInvalidField(formRef);
  const form = useAppForm({
    defaultValues: defaultValues,
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: ({ value }) => {
      createArticleMutation.mutate(value, {
        onSuccess: (article) => {
          queryClient.invalidateQueries();
          router.push(`/article/${article.id}`);
        },
        onError: (err) => {
          if (isDefinedError(err)) {
            match(err)
              .with({ code: "INPUT_VALIDATION_FAILED" }, () => {
                form.setErrorMap({
                  onSubmit: {
                    form: err.data.formErrors,
                    fields: err.data.fieldErrors,
                  },
                });
              })
              .exhaustive();
            focusFirstInvalidField();
          } else {
            toast.error("An unexpected error occurred");
          }
        },
      });
    },
  });

  return (
    <form.AppForm>
      <form.FormRoot ref={formRef}>
        <FieldGroup>
          <form.AppField name="title">
            {(field) => <field.TextField label="Title" placeholder="Article Title" />}
          </form.AppField>
          <form.AppField name="description">
            {(field) => <field.TextField label="Description" placeholder="What's this article about" />}
          </form.AppField>
          <form.AppField name="body">
            {(field) => <field.TextAreaField label="Content" placeholder="Write your article (in markdown)" />}
          </form.AppField>
          <form.AppField name="tags">
            {(field) => <field.TextField label="Tags" placeholder="Add tags for your article (space separated)" />}
          </form.AppField>
          {/* <AuthErrorField error={globalError} /> */}
          <div>
            <form.SubmitButton>Publish Article</form.SubmitButton>
          </div>
        </FieldGroup>
      </form.FormRoot>
    </form.AppForm>
  );
}
