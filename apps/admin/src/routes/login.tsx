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
import { sessionQueryKey, sessionQueryOptions } from "@/shared/lib/session";

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
    const session = await context.queryClient.ensureQueryData(
      sessionQueryOptions
    );
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

      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      navigate({ to: search.redirect ?? "/" });
    },
  });

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
