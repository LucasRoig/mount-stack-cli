"use client";
import { FieldError } from "@lro-ui/field";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import type { $ERROR_CODES } from "@/lib/auth/auth-client";

export type AuthError = {
  code?: string | undefined;
  message?: string | undefined;
  status: number;
  statusText: string;
};

type AuthErrorFieldProps = {
  error: AuthError | undefined;
};

type ErrorTypes = Partial<Record<keyof typeof $ERROR_CODES, string>>;

const useGetAuthErrorMessage = () => {
  const t = useTranslations("authErrors");

  const errorCodes = {
    USER_ALREADY_EXISTS: t("USER_ALREADY_EXISTS"),
    INVALID_EMAIL_OR_PASSWORD: t("INVALID_EMAIL_OR_PASSWORD"),
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: t("USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"),
  } satisfies ErrorTypes;

  return useCallback(
    (error: AuthError) => {
      if (error.code && error.code in errorCodes) {
        return errorCodes[error.code as keyof typeof errorCodes];
      } else if (error.message) {
        return error.message
      } else if (error.statusText) {
        return error.statusText
      } else {
        return "An unknown error occurred.";
      }
    },
    [errorCodes],
  );
};

export function AuthErrorField({ error }: AuthErrorFieldProps) {
  const getAuthErrorMessage = useGetAuthErrorMessage();
  const message = error ? getAuthErrorMessage(error) : undefined;
  return <FieldError errors={[message]} />;
}
