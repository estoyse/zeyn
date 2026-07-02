import { roomLimits } from "@shaxsiy-oyin/api/game-types";
import { DeployPanel } from "./DeployPanel";

interface CreateSummaryProps {
  hasName: boolean;
  selectedCount: number;
  hasEnoughSubjects: boolean;
  isPublic: boolean;
  canCreate: boolean;
  isCreating: boolean;
  onCreate: () => void;
}

export function CreateSummary({
  hasName,
  selectedCount,
  hasEnoughSubjects,
  isPublic,
  canCreate,
  isCreating,
  onCreate,
}: CreateSummaryProps) {
  return (
    <DeployPanel
      checks={[
        { label: "Room name set", done: hasName },
        {
          label: `Subjects selected (${selectedCount}/${roomLimits.minSubjects} min)`,
          done: hasEnoughSubjects,
        },
        { label: isPublic ? "Public room" : "Private room", done: true },
      ]}
      canCreate={canCreate}
      isCreating={isCreating}
      onCreate={onCreate}
      note="Rooms are automatically archived after 1 hour of inactivity. Public rooms appear on the global dashboard and are searchable by all players."
    />
  );
}
