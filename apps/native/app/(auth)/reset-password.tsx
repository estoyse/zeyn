import { Screen } from "@/components/ui";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export default function ResetPasswordScreen() {
  return (
    <Screen contentClassName="items-center justify-center gap-4 px-6 py-10" edges={["bottom"]}>
      <ResetPasswordForm />
    </Screen>
  );
}
