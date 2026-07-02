import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Card, CardContent } from "@shaxsiy-oyin/ui/components/card";
import { GeneralConfigCard } from "@/features/game/components/create/GeneralConfigCard";
import { ArtistPicker } from "./ArtistPicker";
import { useMusicCreateForm } from "./useMusicCreateForm";

function Dot({ on }: { on: boolean }) {
  return (
    <div className={`size-2 rounded-full ${on ? "bg-white" : "bg-white/20"}`} />
  );
}

export function MusicCreateForm() {
  const form = useMusicCreateForm();
  const { values } = form;

  return (
    <div className='grid gap-8 lg:grid-cols-[1fr_400px]'>
      <div className='space-y-8'>
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

      <div className='space-y-6 h-fit sticky top-8'>
        <Card className='bg-primary text-primary-foreground border-none shadow-xl'>
          <CardContent className='p-8 space-y-6'>
            <h3 className='text-xl font-bold'>Ready to Create?</h3>
            <div className='space-y-2'>
              <div className='flex items-center gap-2 text-sm'>
                <Dot on={form.checks.hasName} />
                Name set
              </div>
              <div className='flex items-center gap-2 text-sm'>
                <Dot on={form.checks.hasArtists} />
                Artists selected ({values.selectedArtistIds.length})
              </div>
              <div className='flex items-center gap-2 text-sm'>
                <Dot on={values.isPublic} />
                {values.isPublic ? "Public room" : "Private room"}
              </div>
            </div>
            <Button
              variant='secondary'
              className='w-full'
              disabled={!form.canCreate || form.isCreating}
              onClick={form.create}
            >
              {form.isCreating ? "Creating..." : "Create Game"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
