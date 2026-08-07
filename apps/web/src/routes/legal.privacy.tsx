import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/features/legal/components/LegalPage";

export const Route = createFileRoute("/legal/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return <LegalPage doc="privacy" />;
}
