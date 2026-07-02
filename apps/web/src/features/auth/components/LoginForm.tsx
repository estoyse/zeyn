import { motion } from "framer-motion";
import { Mail, Lock } from "lucide-react";
import { Button } from "@zeyn/ui/components/button";
import { useForm } from "@tanstack/react-form";
import z from "zod";
import {
  Field,
  FieldDescription,
  FieldSeparator,
} from "@zeyn/ui/components/field";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AuthField } from "./AuthField";
import { emailSchema, passwordSchema } from "@/features/auth/lib/authSchemas";

interface LoginFormProps {
  onSwitch: () => void;
  returnTo?: string;
}

export function LoginForm({ onSwitch, returnTo }: LoginFormProps) {
  const { signIn, signInWithGoogle } = useAuth();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: z.object({
        email: emailSchema,
        password: passwordSchema,
      }),
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className='space-y-4'
    >
      <form.Field name='email'>
        {field => (
          <AuthField
            field={field}
            label='Email'
            type='email'
            placeholder='sizning@email.com'
            icon={Mail}
          />
        )}
      </form.Field>
      <form.Field name='password'>
        {field => (
          <AuthField
            field={field}
            label='Parol'
            type='password'
            placeholder='••••••••'
            icon={Lock}
          />
        )}
      </form.Field>
      <form.Subscribe selector={state => state.canSubmit}>
        {() => (
          <Field>
            <Button
              type='submit'
              variant='brand'
              className='w-full'
              onClick={e => {
                e.preventDefault();
                form.handleSubmit();
                signIn(
                  form.getFieldValue("email"),
                  form.getFieldValue("password"),
                  returnTo
                );
              }}
            >
              Kirish
            </Button>
          </Field>
        )}
      </form.Subscribe>
      <div className='my-2'>
        <FieldSeparator>Yoki</FieldSeparator>
      </div>
      <Field>
        <Button
          variant='outline'
          type='button'
          className='w-full gap-2'
          onClick={() => signInWithGoogle(returnTo)}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            height='24'
            viewBox='0 0 24 24'
            width='24'
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
          Google bilan davom etish
        </Button>
        <FieldDescription className='text-center'>
          Hisobingiz yo&apos;qmi?{" "}
          <button
            type='button'
            onClick={onSwitch}
            className='underline underline-offset-4'
          >
            Ro&apos;yxatdan o&apos;ting
          </button>
        </FieldDescription>
      </Field>
    </motion.div>
  );
}
