import { useCreateGameForm } from "@/features/game/hooks/useCreateGameForm";
import { GeneralConfigCard } from "@/features/game/components/create/GeneralConfigCard";
import { SubjectPicker } from "@/features/game/components/create/SubjectPicker";
import { CreateSummary } from "@/features/game/components/create/CreateSummary";

export function BuzzerCreateForm() {
  const form = useCreateGameForm();
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
  );
}
