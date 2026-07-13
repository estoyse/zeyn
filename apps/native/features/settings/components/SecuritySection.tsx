import { useForm } from "@tanstack/react-form";
import {
  Button,
  FieldError,
  Input,
  Label,
  Spinner,
  TextField,
  useToast,
} from "heroui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import z from "zod";

import { Text } from "@/components/ui";
import { createAuthSchemas } from "@/features/auth/authSchemas";
import { getErrorMessage } from "@/features/auth/lib/getErrorMessage";
import { authClient } from "@/lib/auth-client";

export function SecuritySection() {
  const { t } = useTranslation("settings");
  const { t: tAuth } = useTranslation("auth");
  const { toast } = useToast();
  const { newPasswordSchema } = createAuthSchemas(tAuth);

  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: z
        .object({
          currentPassword: z.string().min(1),
          newPassword: newPasswordSchema,
          confirmPassword: z.string(),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: tAuth("validation.passwordMismatch"),
          path: ["confirmPassword"],
        }),
    },
    onSubmit: async ({ value, formApi }) => {
      await authClient.changePassword(
        {
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
          revokeOtherSessions: true,
        },
        {
          onSuccess: () => {
            toast.show({ variant: "success", label: t("password.updated") });
            formApi.reset();
          },
          onError: (ctx) => {
            toast.show({
              variant: "danger",
              label: ctx.error.message || t("password.error"),
            });
          },
        },
      );
    },
  });

  return (
    <View className="gap-3">
      <form.Subscribe
        selector={(state) => ({
          isSubmitting: state.isSubmitting,
          validationError: getErrorMessage(state.errorMap.onSubmit),
        })}
      >
        {({ isSubmitting, validationError }) => (
          <>
            <FieldError isInvalid={!!validationError} className="mb-1">
              {validationError}
            </FieldError>

            <form.Field name="currentPassword">
              {(field) => (
                <TextField>
                  <Label>{t("password.current")}</Label>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChangeText={field.handleChange}
                    secureTextEntry
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="next"
                  />
                </TextField>
              )}
            </form.Field>

            <form.Field name="newPassword">
              {(field) => (
                <TextField>
                  <Label>{t("password.new")}</Label>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChangeText={field.handleChange}
                    secureTextEntry
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="next"
                  />
                  <Text className="text-muted-foreground text-xs">{t("password.hint")}</Text>
                </TextField>
              )}
            </form.Field>

            <form.Field name="confirmPassword">
              {(field) => (
                <TextField>
                  <Label>{tAuth("field.confirmPasswordLabel")}</Label>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChangeText={field.handleChange}
                    secureTextEntry
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="go"
                    onSubmitEditing={form.handleSubmit}
                  />
                </TextField>
              )}
            </form.Field>

            <Button onPress={form.handleSubmit} isDisabled={isSubmitting} className="mt-1">
              {isSubmitting ? (
                <Spinner size="sm" color="default" />
              ) : (
                <Button.Label>{t("password.save")}</Button.Label>
              )}
            </Button>
          </>
        )}
      </form.Subscribe>
    </View>
  );
}
