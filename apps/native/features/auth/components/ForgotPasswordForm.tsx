import { useForm } from "@tanstack/react-form";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { FieldError, Input, Label, Spinner, Surface, TextField, useToast } from "heroui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, Heading, Text } from "@/components/ui";
import { createForgotPasswordSchema } from "@/features/auth/authSchemas";
import { getErrorMessage } from "@/features/auth/lib/getErrorMessage";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const { t } = useTranslation("auth");
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: createForgotPasswordSchema(t),
    },
    onSubmit: async ({ value }) => {
      try {
        await authClient.requestPasswordReset({
          email: value.email.trim(),
          redirectTo: Linking.createURL("/reset-password"),
        });
        setIsSubmitted(true);
      } catch {
        toast.show({
          variant: "danger",
          label: t("toast.forgotPasswordError"),
        });
      }
    },
  });

  if (isSubmitted) {
    return (
      <View className="w-full max-w-sm gap-6">
        <Surface variant="secondary" className="items-center gap-3 rounded-lg p-4">
          <Heading className="text-center">{t("forgotPassword.successTitle")}</Heading>
          <Text className="text-muted-foreground text-center text-sm">
            {t("forgotPassword.successDescription")}
          </Text>
          <Button
            variant="secondary"
            onPress={() => router.replace("/(auth)/login")}
            className="mt-2 w-full"
          >
            <Button.Label>{t("forgotPassword.backToLoginButton")}</Button.Label>
          </Button>
        </Surface>
      </View>
    );
  }

  return (
    <View className="w-full max-w-sm gap-6">
      <View className="items-center gap-1">
        <Heading className="text-center">{t("forgotPassword.title")}</Heading>
        <Text className="text-muted-foreground text-center text-sm">
          {t("forgotPassword.description")}
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

              <form.Field name="email">
                {(field) => (
                  <TextField>
                    <Label>{t("field.emailLabel")}</Label>
                    <Input
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChangeText={field.handleChange}
                      placeholder={t("field.emailPlaceholder")}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      textContentType="emailAddress"
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
                  <Button.Label>{t("forgotPassword.submitButton")}</Button.Label>
                )}
              </Button>

              <Text
                weight="medium"
                className="text-muted-foreground mt-1 text-center text-sm"
                onPress={() => router.back()}
              >
                {t("forgotPassword.backToLoginButton")}
              </Text>
            </View>
          )}
        </form.Subscribe>
      </Surface>
    </View>
  );
}
