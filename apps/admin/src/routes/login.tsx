import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@zeyn/ui/components/button";
import { Field, FieldLabel } from "@zeyn/ui/components/field";
import { Input } from "@zeyn/ui/components/input";
import { Lock, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/shared/lib/auth-client";
import { refreshSession, sessionQueryOptions } from "@/shared/lib/session";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

const credentialsSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData({
      ...sessionQueryOptions,
      revalidateIfStale: true,
    });
    if (session && session.user.role === "admin") {
      throw redirect({ to: search.redirect ?? "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { queryClient } = Route.useRouteContext();
  const [isPending, setIsPending] = useState(false);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: credentialsSchema },
    onSubmit: async ({ value }) => {
      setIsPending(true);
      const result = await authClient.signIn.email({
        email: value.email,
        password: value.password,
      });
      setIsPending(false);

      if (result.error) {
        toast.error(result.error.message ?? "Sign in failed");
        return;
      }

      await refreshSession(queryClient);
      navigate({ to: search.redirect ?? "/" });
    },
  });

  const signInWithGoogle = () => {
    const origin = window.location.origin;
    authClient.signIn.social({
      provider: "google",
      callbackURL: `${origin}${search.redirect ?? "/"}`,
      errorCallbackURL: `${origin}/login`,
    });
  };

  return (
    <div className='flex min-h-svh items-center justify-center p-6'>
      <div className='w-full max-w-sm border p-8'>
        <p className='text-[10px] font-black tracking-[0.4em] text-muted-foreground uppercase'>
          Zeyn
        </p>
        <h1 className='mt-1 text-2xl font-semibold tracking-tight'>
          Admin console
        </h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Sign in with an account that has the admin role.
        </p>

        <form
          className='mt-8 space-y-4'
          onSubmit={event => {
            event.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field name='email'>
            {field => (
              <Field>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <div className='relative'>
                  <Mail className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id={field.name}
                    name={field.name}
                    type='email'
                    autoComplete='email'
                    className='pl-9'
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={event => field.handleChange(event.target.value)}
                  />
                </div>
                <FieldErrors errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <form.Field name='password'>
            {field => (
              <Field>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <div className='relative'>
                  <Lock className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id={field.name}
                    name={field.name}
                    type='password'
                    autoComplete='current-password'
                    className='pl-9'
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={event => field.handleChange(event.target.value)}
                  />
                </div>
                <FieldErrors errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <Button
            type='submit'
            variant='brand'
            className='w-full'
            disabled={isPending}
          >
            {isPending ? "Signing in" : "Sign in"}
          </Button>
        </form>

        <div className='my-6 flex items-center gap-3'>
          <span className='h-px flex-1 bg-border' />
          <span className='text-[10px] font-medium tracking-widest text-muted-foreground uppercase'>
            or
          </span>
          <span className='h-px flex-1 bg-border' />
        </div>

        <Button
          type='button'
          variant='outline'
          className='w-full gap-2'
          onClick={signInWithGoogle}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            className='size-4'
          >
            <path
              d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              fill='#4285F4'
            />
            <path
              d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              fill='#34A853'
            />
            <path
              d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              fill='#FBBC05'
            />
            <path
              d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              fill='#EA4335'
            />
            <path d='M1 1h22v22H1z' fill='none' />
          </svg>
          Continue with Google
        </Button>
      </div>
    </div>
  );
}

function FieldErrors({ errors }: { errors: unknown[] }) {
  if (errors.length === 0) return null;
  return (
    <p className='text-xs text-destructive'>
      {errors
        .map(error =>
          typeof error === "string"
            ? error
            : ((error as { message?: string } | null)?.message ?? "")
        )
        .filter(Boolean)
        .join(", ")}
    </p>
  );
}
