import { useMutation } from "@tanstack/react-query";
import { router, type Href } from "expo-router";
import { Button, Card, Dialog, Input, Spinner, TextField, useToast } from "heroui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useAuth } from "@/features/auth/useAuth";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export function DangerSection({ username }: { username: string }) {
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
