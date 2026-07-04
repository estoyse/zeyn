import { useTranslation } from "react-i18next";
import { GeneralConfigCard } from "@/features/game/components/create/GeneralConfigCard";
import { DeployPanel } from "@/features/game/components/create/DeployPanel";
import { ArtistPicker } from "./ArtistPicker";
import { useMusicCreateForm } from "./useMusicCreateForm";

export function MusicCreateForm() {
  const { t } = useTranslation();
  const form = useMusicCreateForm();
  const { values } = form;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-8">
        <GeneralConfigCard
          name={values.name}
          onNameChange={form.setName}
          maxPlayers={values.maxPlayers}
          onMaxPlayersChange={form.setMaxPlayers}
          isPublic={values.isPublic}
          onIsPublicChange={form.setIsPublic}
          password={values.password}
          onPasswordChange={form.setPassword}
        />
        <ArtistPicker
          artists={form.artists}
          isLoading={form.artistsLoading}
          selectedIds={values.selectedArtistIds}
          onToggle={form.toggleArtist}
        />
      </div>

      <DeployPanel
        checks={[
          { label: t("game:create.summary.roomNameSet"), done: form.checks.hasName },
          {
            label: t("games:music.create.artistsSelected", {
              count: values.selectedArtistIds.length,
            }),
            done: form.checks.hasArtists,
          },
          {
            label: values.isPublic
              ? t("game:create.summary.publicRoom")
              : t("game:create.summary.privateRoom"),
            done: true,
          },
        ]}
        canCreate={form.canCreate}
        isCreating={form.isCreating}
        onCreate={form.create}
        note={t("game:create.summary.note")}
      />
    </div>
  );
}
