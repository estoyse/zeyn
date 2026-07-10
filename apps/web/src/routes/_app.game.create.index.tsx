import { createFileRoute } from "@tanstack/react-router";
import { Gamepad2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GameCatalog } from "@/features/games/components/GameCatalog";
import { PageHeader } from "@/shared/components/app/PageHeader";
import { PageShell } from "@/shared/components/app/PageShell";

export const Route = createFileRoute("/_app/game/create/")({
  component: CreatePickerPage,
});

function CreatePickerPage() {
  const { t } = useTranslation();

  return (
    <PageShell width='lg' gap='md'>
      <PageHeader
        back={{ to: "/" }}
        icon={Gamepad2}
        title={t("game:create.picker.title")}
        subtitle={t("game:create.picker.subtitle")}
      />

      <GameCatalog />
    </PageShell>
  );
}
