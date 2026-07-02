import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FieldGroup } from "@zeyn/ui/components/field";
import { cn } from "@zeyn/ui/lib/utils";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export function AuthForm({
  className,
  returnTo,
  ...props
}: React.ComponentProps<"form"> & { returnTo?: string }) {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <AnimatePresence mode='wait'>
          {isRegister ? (
            <RegisterForm
              key='register'
              onSwitch={() => setIsRegister(false)}
              returnTo={returnTo}
            />
          ) : (
            <LoginForm key='login' onSwitch={() => setIsRegister(true)} returnTo={returnTo} />
          )}
        </AnimatePresence>
      </FieldGroup>
    </form>
  );
}
