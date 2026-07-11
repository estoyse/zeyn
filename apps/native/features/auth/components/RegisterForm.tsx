import { useForm } from "@tanstack/react-form";
import { FieldError, Input, Label, Spinner, TextField } from "heroui-native";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";

import { Button, Text } from "@/components/ui";
import { createRegisterSchema } from "@/features/auth/authSchemas";
import { getErrorMessage } from "@/features/auth/lib/getErrorMessage";
import { useAuth } from "@/features/auth/useAuth";

type RegisterFormProps = {
  onSwitch: () => void;
  returnTo?: string;
};

export function RegisterForm({ onSwitch, returnTo }: RegisterFormProps) {
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const { t } = useTranslation("auth");
  const { signUp } = useAuth();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    validators: {
      onSubmit: createRegisterSchema(t),
    },
    onSubmit: async ({ value, formApi }) => {
      await signUp(value.email.trim(), value.password, value.name.trim(), returnTo);
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

            <form.Field name="name">
              {(field) => (
                <TextField>
                  <Label>{t("field.nameLabel")}</Label>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChangeText={field.handleChange}
                    placeholder={t("field.namePlaceholder")}
                    autoComplete="name"
                    textContentType="name"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => {
                      emailInputRef.current?.focus();
                    }}
                  />
                </TextField>
              )}
            </form.Field>

            <form.Field name="email">
              {(field) => (
                <TextField>
                  <Label>{t("field.emailLabel")}</Label>
                  <Input
                    ref={emailInputRef}
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
                <Button.Label>{t("register.submitButton")}</Button.Label>
              )}
            </Button>
          </>
        )}
      </form.Subscribe>

      <View className="mt-1 flex-row items-center justify-center gap-1">
        <Text className="text-muted-foreground text-sm">{t("register.haveAccountText")}</Text>
        <Text weight="semibold" className="text-sm" onPress={onSwitch}>
          {t("register.switchToLogin")}
        </Text>
      </View>
    </View>
  );
}
