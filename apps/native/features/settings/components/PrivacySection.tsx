import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch, useToast } from "heroui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Group, Row, RowSeparator } from "@/components/ui";
import { trpc } from "@/utils/trpc";

import type { MeData } from "./types";

export function PrivacySection({ me }: { me: MeData }) {
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
    <Group>
      <Row
        label={t("privacy.publicProfile.label")}
        caption={t("privacy.publicProfile.description")}
        trailing={<Switch
          isSelected={state.isProfilePublic}
          onSelectedChange={(value) => update("isProfilePublic", value)}
        />}
      />

      <RowSeparator />


      <Row
        label={t("privacy.showStats.label")}
        caption={t("privacy.showStats.description")}
        trailing={<Switch
          isSelected={state.showStats}
          isDisabled={!state.isProfilePublic}
          onSelectedChange={(value) => update("showStats", value)}
        />}
      />

      <RowSeparator />


      <Row
        label={t("privacy.showHistory.label")}
        caption={t("privacy.showHistory.description")}
        trailing={<Switch
          isSelected={state.showHistory}
          isDisabled={!state.isProfilePublic}
          onSelectedChange={(value) => update("showHistory", value)}
        />}
      />

      <RowSeparator />


      <Row
        label={t("privacy.showHostedGames.label")}
        caption={t("privacy.showHostedGames.description")}
        trailing={<Switch
          isSelected={state.showHostedGames}
          isDisabled={!state.isProfilePublic}
          onSelectedChange={(value) => update("showHostedGames", value)}
        />}
      />
    </Group>
  );
}
