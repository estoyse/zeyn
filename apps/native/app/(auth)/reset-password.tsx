import { Screen } from "@/components/ui";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export default function ResetPasswordScreen() {
  return (
    <Screen contentClassName="items-center justify-center" edges={["bottom"]}>
      <ResetPasswordForm />
    </Screen>
  );
}
