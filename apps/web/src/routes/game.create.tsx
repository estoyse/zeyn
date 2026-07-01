import { createFileRoute } from "@tanstack/react-router";
import { Settings2 } from "lucide-react";
import { useCreateGameForm } from "@/lib/useCreateGameForm";
import { GeneralConfigCard } from "@/components/game/create/GeneralConfigCard";
import { SubjectPicker } from "@/components/game/create/SubjectPicker";
import { CreateSummary } from "@/components/game/create/CreateSummary";

export const Route = createFileRoute("/game/create")({
  component: CreateGamePage,
});

function CreateGamePage() {
  const form = useCreateGameForm();
  const { values } = form;

  return (
    <div className='min-h-screen bg-background p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-6xl space-y-8'>
        <header className='space-y-2'>
          <div className='flex items-center gap-3'>
            <div className='flex size-12 items-center justify-center bg-primary rounded-xl'>
              <Settings2 className='size-6 text-primary-foreground' />
            </div>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>
                Setup Your Arena
              </h1>
              <p className='text-muted-foreground italic'>
                Configure the battlefield before deploying.
              </p>
            </div>
          </div>
        </header>

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
            <SubjectPicker
              subjects={form.subjects}
              isLoading={form.subjectsLoading}
              selectedIds={values.selectedSubjectIds}
              onToggle={form.toggleSubject}
            />
          </div>

          <CreateSummary
            hasName={form.checks.hasName}
            selectedCount={values.selectedSubjectIds.length}
            hasEnoughSubjects={form.checks.hasEnoughSubjects}
            isPublic={values.isPublic}
            canCreate={form.canCreate}
            isCreating={form.isCreating}
            onCreate={form.create}
          />
        </div>
      </div>
    </div>
  );
}
