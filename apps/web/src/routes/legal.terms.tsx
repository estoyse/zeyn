import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/features/legal/components/LegalPage";

export const Route = createFileRoute("/legal/terms")({
  component: TermsPage,
});

function TermsPage() {
  return <LegalPage doc="terms" />;
}
