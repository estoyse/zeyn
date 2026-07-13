import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { getErrorMessage } from "@/features/auth/lib/getErrorMessage";
import { trpc } from "@/utils/trpc";

import type { MeData } from "./types";

export function AccountSection({ me }: { me: MeData }) {
  const { t } = useTranslation("settings");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation(
    trpc.profile.updateProfile.mutationOptions({
      onSuccess: () => {
        toast.show({ variant: "success", label: t("account.updated") });
        queryClient.invalidateQueries({ queryKey: trpc.profile.getMe.queryKey() });
      },
      onError: (error) => {
        toast.show({ variant: "danger", label: error.message });
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      name: me.name,
      username: me.username,
      bio: me.bio ?? "",
    },
    validators: {
      onSubmit: z.object({
        name: z.string().trim().min(1).max(60),
        username: z
          .string()
          .trim()
          .toLowerCase()
          .min(3)
          .max(20)
          .regex(/^[a-z0-9_]+$/),
        bio: z.string().max(280),
      }),
    },
    onSubmit: async ({ value }) => {
      await updateMutation.mutateAsync({
        name: value.name.trim(),
        username: value.username.trim().toLowerCase(),
        bio: value.bio,
      });
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
                  <Label>{t("account.displayName")}</Label>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChangeText={field.handleChange}
                    maxLength={60}
                    returnKeyType="next"
                  />
                </TextField>
              )}
            </form.Field>

            <form.Field name="username">
              {(field) => (
                <TextField>
                  <Label>{t("account.username")}</Label>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChangeText={(value) =>
                      field.handleChange(value.toLowerCase().replace(/\s/g, ""))
                    }
                    maxLength={20}
                    autoCapitalize="none"
                    spellCheck={false}
                    returnKeyType="next"
                  />
                  <Text className="text-muted-foreground text-xs">
                    {t("account.usernameProfileUrl", {
                      username: field.state.value || "…",
                    })}
                  </Text>
                </TextField>
              )}
            </form.Field>

            <form.Field name="bio">
              {(field) => (
                <TextField>
                  <Label>{t("account.bio")}</Label>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChangeText={field.handleChange}
                    placeholder={t("account.bioPlaceholder")}
                    multiline
                    numberOfLines={4}
                    maxLength={280}
                  />
                  <Text className="text-muted-foreground self-end text-xs">
                    {field.state.value.length}/280
                  </Text>
                </TextField>
              )}
            </form.Field>

            <Button onPress={form.handleSubmit} isDisabled={isSubmitting} className="mt-1">
              {isSubmitting ? (
                <Spinner size="sm" color="default" />
              ) : (
                <Button.Label>{t("account.save")}</Button.Label>
              )}
            </Button>
          </>
        )}
      </form.Subscribe>
    </View>
  );
}
