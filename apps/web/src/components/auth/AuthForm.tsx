import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FieldGroup } from "@shaxsiy-oyin/ui/components/field";
import { cn } from "@shaxsiy-oyin/ui/lib/utils";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export function AuthForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <AnimatePresence mode='wait'>
          {isRegister ? (
            <RegisterForm
              key='register'
              onSwitch={() => setIsRegister(false)}
            />
          ) : (
            <LoginForm key='login' onSwitch={() => setIsRegister(true)} />
          )}
        </AnimatePresence>
      </FieldGroup>
    </form>
  );
}
