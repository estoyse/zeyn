import { useForm } from "@tanstack/react-form";
import { router, useLocalSearchParams } from "expo-router";
import { FieldError, Input, Label, Spinner, Surface, TextField, useToast } from "heroui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, Heading, Text } from "@/components/ui";
import { createResetPasswordSchema } from "@/features/auth/authSchemas";
import { getErrorMessage } from "@/features/auth/lib/getErrorMessage";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm() {
  const { t } = useTranslation("auth");
  const { toast } = useToast();
  const { token: rawToken } = useLocalSearchParams<{ token?: string }>();
  const token = typeof rawToken === "string" ? rawToken : undefined;

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: createResetPasswordSchema(t),
    },
    onSubmit: async ({ value }) => {
      if (!token) return;

      try {
        await authClient.resetPassword({
          newPassword: value.password,
          token,
        });
        toast.show({
          variant: "success",
          label: t("toast.resetPasswordSuccess"),
        });
        router.replace("/(auth)/login");
      } catch {
        toast.show({
          variant: "danger",
          label: t("toast.resetPasswordError"),
        });
      }
    },
  });

  if (!token) {
    return (
      <View className="w-full max-w-sm gap-6">
        <Surface variant="secondary" className="items-center gap-3 rounded-lg p-4">
          <Heading className="text-center">{t("resetPassword.invalidLinkTitle")}</Heading>
          <Text className="text-muted-foreground text-center text-sm">
            {t("resetPassword.invalidLinkDescription")}
          </Text>
          <Button
            onPress={() => router.replace("/(auth)/forgot-password")}
            className="mt-2 w-full"
          >
            <Button.Label>{t("resetPassword.requestNewLinkButton")}</Button.Label>
          </Button>
        </Surface>
      </View>
    );
  }

  return (
    <View className="w-full max-w-sm gap-6">
      <View className="items-center gap-1">
        <Heading className="text-center">{t("resetPassword.title")}</Heading>
        <Text className="text-muted-foreground text-center text-sm">
          {t("resetPassword.description")}
        </Text>
      </View>

      <Surface variant="secondary" className="rounded-lg p-4">
        <form.Subscribe
          selector={(state) => ({
            isSubmitting: state.isSubmitting,
            validationError: getErrorMessage(state.errorMap.onSubmit),
          })}
        >
          {({ isSubmitting, validationError }) => (
            <View className="gap-3">
              <FieldError isInvalid={!!validationError} className="mb-1">
                {validationError}
              </FieldError>

              <form.Field name="password">
                {(field) => (
                  <TextField>
                    <Label>{t("field.newPasswordLabel")}</Label>
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChangeText={field.handleChange}
                      placeholder={t("field.passwordPlaceholder")}
                      secureTextEntry
                      autoComplete="new-password"
                      textContentType="newPassword"
                      returnKeyType="next"
                    />
                  </TextField>
                )}
              </form.Field>

              <form.Field name="confirmPassword">
                {(field) => (
                  <TextField>
                    <Label>{t("field.confirmPasswordLabel")}</Label>
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChangeText={field.handleChange}
                      placeholder={t("field.passwordPlaceholder")}
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
                  <Button.Label>{t("resetPassword.submitButton")}</Button.Label>
                )}
              </Button>
            </View>
          )}
        </form.Subscribe>
      </Surface>
    </View>
  );
}
