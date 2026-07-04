import { roomLimits } from "@zeyn/api/game-types";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <DeployPanel
      checks={[
        { label: t("game:create.summary.roomNameSet"), done: hasName },
        {
          label: t("game:create.summary.subjectsSelected", {
            count: selectedCount,
            min: roomLimits.minSubjects,
          }),
          done: hasEnoughSubjects,
        },
        {
          label: isPublic
            ? t("game:create.summary.publicRoom")
            : t("game:create.summary.privateRoom"),
          done: true,
        },
      ]}
      canCreate={canCreate}
      isCreating={isCreating}
      onCreate={onCreate}
      note={t("game:create.summary.note")}
    />
  );
}
