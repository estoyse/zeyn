import { Screen } from "@/components/ui";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export default function ForgotPasswordScreen() {
  return (
    <Screen contentClassName="items-center justify-center gap-4 px-6 py-10" edges={["bottom"]}>
      <ForgotPasswordForm />
    </Screen>
  );
}
