import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Switch } from "@zeyn/ui/components/switch";
import { trpc } from "@/shared/lib/trpc";
import { toast } from "sonner";

interface PrivacyState {
  isProfilePublic: boolean;
  showStats: boolean;
  showHistory: boolean;
  showHostedGames: boolean;
}

interface PrivacySettingsProps {
  me: PrivacyState;
}

type PrivacyKey = keyof PrivacyState;

const SECTION_TOGGLES: { key: PrivacyKey; labelKey: string; descriptionKey: string }[] =
  [
    {
      key: "showStats",
      labelKey: "settings:privacy.showStats.label",
      descriptionKey: "settings:privacy.showStats.description",
    },
    {
      key: "showHistory",
      labelKey: "settings:privacy.showHistory.label",
      descriptionKey: "settings:privacy.showHistory.description",
    },
    {
      key: "showHostedGames",
      labelKey: "settings:privacy.showHostedGames.label",
      descriptionKey: "settings:privacy.showHostedGames.description",
    },
  ];

export function PrivacySettings({ me }: PrivacySettingsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [state, setState] = useState<PrivacyState>(me);

  const mutation = useMutation(
    trpc.profile.updatePrivacy.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.profile.getMe.queryKey(),
        });
      },
      onError: (error, variables) => {
        toast.error(error.message);
        setState(prev => ({ ...prev, ...invert(variables) }));
      },
    })
  );

  const update = (key: PrivacyKey, value: boolean) => {
    setState(prev => ({ ...prev, [key]: value }));
    mutation.mutate({ [key]: value });
  };

  return (
    <div className='divide-y border'>
      <ToggleRow
        label={t("settings:privacy.publicProfile.label")}
        description={t("settings:privacy.publicProfile.description")}
        checked={state.isProfilePublic}
        onChange={value => update("isProfilePublic", value)}
      />
      {SECTION_TOGGLES.map(section => (
        <ToggleRow
          key={section.key}
          label={t(section.labelKey)}
          description={t(section.descriptionKey)}
          checked={state[section.key]}
          disabled={!state.isProfilePublic}
          onChange={value => update(section.key, value)}
        />
      ))}
    </div>
  );
}

function invert(variables: Record<string, unknown>): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(variables)) {
    if (typeof value === "boolean") out[key] = !value;
  }
  return out;
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 p-4 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div className='space-y-0.5'>
        <p className='text-sm font-medium'>{label}</p>
        <p className='text-xs text-muted-foreground'>{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    </div>
  );
}
