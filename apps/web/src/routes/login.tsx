import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, GalleryVerticalEnd } from "lucide-react";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Input } from "@shaxsiy-oyin/ui/components/input";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@shaxsiy-oyin/ui/components/field";
import { cn } from "@shaxsiy-oyin/ui/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: AuthPage,
});

export default function AuthPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link to="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Shaxsiy O'yin
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <AuthForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/login.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.5] dark:grayscale"
        />
      </div>
    </div>
  );
}

export function AuthForm({ className, ...props }: React.ComponentProps<"form">) {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <AnimatePresence mode="wait">
          {isRegister ? (
            <RegisterForm key="register" onSwitch={() => setIsRegister(false)} />
          ) : (
            <LoginForm key="login" onSwitch={() => setIsRegister(true)} />
          )}
        </AnimatePresence>
      </FieldGroup>
    </form>
  );
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            navigate({ to: "/dashboard" });
            toast.success("Kirish muvaffaqiyatli");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        }
      );
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <form.Field name="email">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                id={field.name}
                type="email"
                placeholder="sizning@email.com"
                className="pl-11"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                required
              />
            </div>
            {field.state.meta.errors.map((error) => (
              <p key={error?.message} className="text-sm text-destructive">
                {error?.message}
              </p>
            ))}
          </Field>
        )}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor={field.name}>Parol</FieldLabel>
              <a
                href="#"
                className="ml-auto text-sm underline-offset-4 hover:underline"
              >
                Unutdingizmi?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                id={field.name}
                type="password"
                placeholder="••••••••"
                className="pl-11"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                required
              />
            </div>
            {field.state.meta.errors.map((error) => (
              <p key={error?.message} className="text-sm text-destructive">
                {error?.message}
              </p>
            ))}
          </Field>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.canSubmit}>
        {() => (
          <Field>
            <Button
              type="submit"
              className="w-full"
              onClick={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              Kirish
            </Button>
          </Field>
        )}
      </form.Subscribe>
      <div className="my-2">
        <FieldSeparator>Yoki</FieldSeparator>
      </div>
      <form.Subscribe selector={(state) => state.canSubmit}>
        {() => (
          <Field>
            <Button
              variant="outline"
              type="button"
              className="w-full gap-2"
              onClick={() => {
                authClient.signIn.social({
                  provider: "google",
                });
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24"
                viewBox="0 0 24 24"
                width="24"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Google bilan davom etish
            </Button>
            <FieldDescription className="text-center">
              Hisobingiz yo&apos;qmi?{" "}
              <button
                type="button"
                onClick={onSwitch}
                className="underline underline-offset-4"
              >
                Ro&apos;yxatdan o&apos;ting
              </button>
            </FieldDescription>
          </Field>
        )}
      </form.Subscribe>
    </motion.div>
  );
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
        },
        {
          onSuccess: () => {
            navigate({ to: "/dashboard" });
            toast.success("Ro'yxatdan o'tish muvaffaqiyatli");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        }
      );
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <form.Field name="name">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Ism</FieldLabel>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                id={field.name}
                type="text"
                placeholder="Ali Valiyev"
                className="pl-11"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                required
              />
            </div>
            {field.state.meta.errors.map((error) => (
              <p key={error?.message} className="text-sm text-destructive">
                {error?.message}
              </p>
            ))}
          </Field>
        )}
      </form.Field>
      <form.Field name="email">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                id={field.name}
                type="email"
                placeholder="sizning@email.com"
                className="pl-11"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                required
              />
            </div>
            {field.state.meta.errors.map((error) => (
              <p key={error?.message} className="text-sm text-destructive">
                {error?.message}
              </p>
            ))}
          </Field>
        )}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Parol</FieldLabel>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                id={field.name}
                type="password"
                placeholder="••••••••"
                className="pl-11"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                required
              />
            </div>
            {field.state.meta.errors.map((error) => (
              <p key={error?.message} className="text-sm text-destructive">
                {error?.message}
              </p>
            ))}
          </Field>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.canSubmit}>
        {() => (
          <Field>
            <Button
              type="submit"
              className="w-full"
              onClick={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              Ro&apos;yxatdan o&apos;tish
            </Button>
          </Field>
        )}
      </form.Subscribe>
      <Field>
        <FieldDescription className="text-center">
          Hisobingiz bormi?{" "}
          <button type="button" onClick={onSwitch} className="underline underline-offset-4">
            Kirish
          </button>
        </FieldDescription>
      </Field>
    </motion.div>
  );
}