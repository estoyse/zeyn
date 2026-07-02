import { GeneralConfigCard } from "@/features/game/components/create/GeneralConfigCard";
import { DeployPanel } from "@/features/game/components/create/DeployPanel";
import { ArtistPicker } from "./ArtistPicker";
import { useMusicCreateForm } from "./useMusicCreateForm";

export function MusicCreateForm() {
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
          { label: "Room name set", done: form.checks.hasName },
          {
            label: `Artists selected (${values.selectedArtistIds.length})`,
            done: form.checks.hasArtists,
          },
          {
            label: values.isPublic ? "Public room" : "Private room",
            done: true,
          },
        ]}
        canCreate={form.canCreate}
        isCreating={form.isCreating}
        onCreate={form.create}
        note="Rooms are automatically archived after 1 hour of inactivity. Public rooms appear on the global dashboard and are searchable by all players."
      />
    </div>
  );
}
