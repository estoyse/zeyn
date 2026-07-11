import { useForm } from "@tanstack/react-form";
import { router } from "expo-router";
import { FieldError, Input, Label, Spinner, TextField } from "heroui-native";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";

import { Button, Text } from "@/components/ui";
import { createLoginSchema } from "@/features/auth/authSchemas";
import { getErrorMessage } from "@/features/auth/lib/getErrorMessage";
import { useAuth } from "@/features/auth/useAuth";

import { SocialButtons } from "./SocialButtons";

type LoginFormProps = {
  onSwitch: () => void;
  returnTo?: string;
};

export function LoginForm({ onSwitch, returnTo }: LoginFormProps) {
  const passwordInputRef = useRef<TextInput>(null);
  const { t } = useTranslation("auth");
  const { signIn } = useAuth();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: createLoginSchema(t),
    },
    onSubmit: async ({ value, formApi }) => {
      await signIn(value.email.trim(), value.password, returnTo);
      formApi.reset();
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
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => {
                      passwordInputRef.current?.focus();
                    }}
                  />
                </TextField>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <TextField>
                  <Label>{t("field.passwordLabel")}</Label>
                  <Input
                    ref={passwordInputRef}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChangeText={field.handleChange}
                    placeholder={t("field.passwordPlaceholder")}
                    secureTextEntry
                    autoComplete="password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={form.handleSubmit}
                  />
                </TextField>
              )}
            </form.Field>

            <View className="-mt-1 items-end">
              <Text
                weight="medium"
                className="text-muted-foreground text-sm"
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                {t("login.forgotPasswordLink")}
              </Text>
            </View>

            <Button onPress={form.handleSubmit} isDisabled={isSubmitting} className="mt-1">
              {isSubmitting ? (
                <Spinner size="sm" color="default" />
              ) : (
                <Button.Label>{t("login.submitButton")}</Button.Label>
              )}
            </Button>
          </>
        )}
      </form.Subscribe>

      <SocialButtons returnTo={returnTo} />

      <View className="mt-1 flex-row items-center justify-center gap-1">
        <Text className="text-muted-foreground text-sm">{t("login.noAccountText")}</Text>
        <Text weight="semibold" className="text-sm" onPress={onSwitch}>
          {t("login.switchToRegister")}
        </Text>
      </View>
    </View>
  );
}
