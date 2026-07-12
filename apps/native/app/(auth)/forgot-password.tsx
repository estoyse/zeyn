import { Screen } from "@/components/ui";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export default function ForgotPasswordScreen() {
  return (
    <Screen contentClassName="items-center justify-center" edges={["bottom"]}>
      <ForgotPasswordForm />
    </Screen>
  );
}
