import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, type Href } from "expo-router";
import {
  Button,
  Card,
  Dialog,
  FieldError,
  Input,
  Label,
  Separator,
  Skeleton,
  Spinner,
  Switch,
  Tabs,
  TextField,
  useToast,
} from "heroui-native";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import z from "zod";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Heading, Screen, Text } from "@/components/ui";
import { createAuthSchemas } from "@/features/auth/authSchemas";
import { getErrorMessage } from "@/features/auth/lib/getErrorMessage";
import { useAuth } from "@/features/auth/useAuth";
import { authClient } from "@/lib/auth-client";
import { setHapticsPref, setSfxMuted, usePrefs } from "@/lib/prefs";
import { trpc } from "@/utils/trpc";

type MeData = {
  name: string;
  username: string;
  bio: string | null;
  isProfilePublic: boolean;
  showStats: boolean;
  showHistory: boolean;
  showHostedGames: boolean;
};

function SectionRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between gap-4 p-4">
      <View className="flex-1 gap-0.5">
        <Text weight="medium" className="text-sm">
          {label}
        </Text>
        <Text className="text-muted-foreground text-xs">{description}</Text>
      </View>
      {children}
    </View>
  );
}

function AccountSection({ me }: { me: MeData }) {
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

function PrivacySection({ me }: { me: MeData }) {
  const { t } = useTranslation("settings");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [state, setState] = useState({
    isProfilePublic: me.isProfilePublic,
    showStats: me.showStats,
    showHistory: me.showHistory,
    showHostedGames: me.showHostedGames,
  });

  const mutation = useMutation(
    trpc.profile.updatePrivacy.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.profile.getMe.queryKey() });
      },
      onError: (error, variables) => {
        toast.show({ variant: "danger", label: error.message });
        setState((prev) => ({ ...prev, ...invert(variables) }));
      },
    }),
  );

  function invert(variables: Record<string, unknown>): Record<string, boolean> {
    const out: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(variables)) {
      if (typeof value === "boolean") out[key] = !value;
    }
    return out;
  }

  function update(key: keyof typeof state, value: boolean) {
    setState((prev) => ({ ...prev, [key]: value }));
    mutation.mutate({ [key]: value });
  }

  return (
    <Card>
      <SectionRow
        label={t("privacy.publicProfile.label")}
        description={t("privacy.publicProfile.description")}
      >
        <Switch
          isSelected={state.isProfilePublic}
          onSelectedChange={(value) => update("isProfilePublic", value)}
        />
      </SectionRow>

      <Separator />

      <SectionRow
        label={t("privacy.showStats.label")}
        description={t("privacy.showStats.description")}
      >
        <Switch
          isSelected={state.showStats}
          isDisabled={!state.isProfilePublic}
          onSelectedChange={(value) => update("showStats", value)}
        />
      </SectionRow>

      <Separator />

      <SectionRow
        label={t("privacy.showHistory.label")}
        description={t("privacy.showHistory.description")}
      >
        <Switch
          isSelected={state.showHistory}
          isDisabled={!state.isProfilePublic}
          onSelectedChange={(value) => update("showHistory", value)}
        />
      </SectionRow>

      <Separator />

      <SectionRow
        label={t("privacy.showHostedGames.label")}
        description={t("privacy.showHostedGames.description")}
      >
        <Switch
          isSelected={state.showHostedGames}
          isDisabled={!state.isProfilePublic}
          onSelectedChange={(value) => update("showHostedGames", value)}
        />
      </SectionRow>
    </Card>
  );
}

function SecuritySection() {
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

function PreferencesSection() {
  const { t } = useTranslation("settings");
  const { sfxMuted, hapticsEnabled } = usePrefs();

  return (
    <Card>
      <SectionRow
        label={t("preferences.theme.label")}
        description={t("preferences.theme.description")}
      >
        <ThemeToggle />
      </SectionRow>

      <Separator />

      <SectionRow
        label={t("preferences.language.label")}
        description={t("preferences.language.description")}
      >
        <LanguageSwitcher />
      </SectionRow>

      <Separator />

      <SectionRow
        label={t("preferences.sound.label")}
        description={t("preferences.sound.description")}
      >
        <Switch
          isSelected={!sfxMuted}
          onSelectedChange={(value) => setSfxMuted(!value)}
        />
      </SectionRow>

      <Separator />

      <SectionRow
        label={t("preferences.haptics.label")}
        description={t("preferences.haptics.description")}
      >
        <Switch isSelected={hapticsEnabled} onSelectedChange={setHapticsPref} />
      </SectionRow>
    </Card>
  );
}

function DangerSection({ username }: { username: string }) {
  const { t } = useTranslation("settings");
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const deleteMutation = useMutation(
    trpc.profile.deleteAccount.mutationOptions({
      onSuccess: async () => {
        await authClient.signOut();
        toast.show({ variant: "success", label: t("danger.deleted") });
        router.replace("/(auth)/login" as Href);
      },
      onError: (error) => {
        toast.show({ variant: "danger", label: error.message });
      },
    }),
  );

  const canDelete = confirmText.replace(/^@/, "") === username && !deleteMutation.isPending;

  return (
    <View className="gap-4">
      <Button variant="outline" onPress={() => signOut()}>
        <Button.Label>{t("signOut", "Sign out")}</Button.Label>
      </Button>

      <Card>
        <Card.Body className="gap-1">
          <Card.Title className="text-destructive">{t("danger.title")}</Card.Title>
          <Card.Description>{t("danger.description")}</Card.Description>
        </Card.Body>
        <Card.Footer>
          <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Trigger asChild>
              <Button variant="danger" className="w-full">
                <Button.Label>{t("danger.trigger")}</Button.Label>
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay />
              <Dialog.Content>
                <Dialog.Close variant="ghost" />
                <View className="mb-5 gap-1.5">
                  <Dialog.Title>{t("danger.confirmTitle")}</Dialog.Title>
                  <Dialog.Description>
                    {t("danger.confirmDescription", { username }).replace(/<\/?bold>/g, "")}
                  </Dialog.Description>
                </View>
                <TextField>
                  <Input
                    value={confirmText}
                    onChangeText={setConfirmText}
                    placeholder={`@${username}`}
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </TextField>
                <View className="mt-4 flex-row justify-end gap-3">
                  <Button variant="ghost" size="sm" onPress={() => setIsOpen(false)}>
                    <Button.Label>{t("danger.cancel")}</Button.Label>
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    isDisabled={!canDelete}
                    onPress={() => deleteMutation.mutate()}
                  >
                    {deleteMutation.isPending ? (
                      <Spinner size="sm" color="default" />
                    ) : (
                      <Button.Label>{t("danger.confirm")}</Button.Label>
                    )}
                  </Button>
                </View>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog>
        </Card.Footer>
      </Card>
    </View>
  );
}

function SettingsSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </View>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation("settings");
  const [activeTab, setActiveTab] = useState("account");

  const meQuery = useQuery(trpc.profile.getMe.queryOptions());
  const me = meQuery.data;

  return (
    <Screen contentClassName="gap-6 px-6 py-6" edges={["top", "bottom"]}>
      <View className="gap-1">
        <Heading className="text-2xl">{t("title")}</Heading>
        <Text className="text-muted-foreground">{t("subtitle")}</Text>
      </View>

      {!me ? (
        <SettingsSkeleton />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List>
            <Tabs.ScrollView>
              <Tabs.Indicator />
              <Tabs.Trigger value="account">
                <Tabs.Label>{t("tabs.account")}</Tabs.Label>
              </Tabs.Trigger>
              <Tabs.Trigger value="privacy">
                <Tabs.Label>{t("tabs.privacy")}</Tabs.Label>
              </Tabs.Trigger>
              <Tabs.Trigger value="security">
                <Tabs.Label>{t("tabs.security")}</Tabs.Label>
              </Tabs.Trigger>
              <Tabs.Trigger value="preferences">
                <Tabs.Label>{t("preferences.title")}</Tabs.Label>
              </Tabs.Trigger>
              <Tabs.Trigger value="danger">
                <Tabs.Label>{t("tabs.danger")}</Tabs.Label>
              </Tabs.Trigger>
            </Tabs.ScrollView>
          </Tabs.List>

          <View className="mt-6">
            <Tabs.Content value="account">
              <AccountSection me={me} />
            </Tabs.Content>
            <Tabs.Content value="privacy">
              <PrivacySection me={me} />
            </Tabs.Content>
            <Tabs.Content value="security">
              <SecuritySection />
            </Tabs.Content>
            <Tabs.Content value="preferences">
              <PreferencesSection />
            </Tabs.Content>
            <Tabs.Content value="danger">
              <DangerSection username={me.username} />
            </Tabs.Content>
          </View>
        </Tabs>
      )}
    </Screen>
  );
}
