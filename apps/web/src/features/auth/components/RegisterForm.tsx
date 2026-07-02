import { motion } from "framer-motion";
import { Mail, Lock, User } from "lucide-react";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import { useForm } from "@tanstack/react-form";
import z from "zod";
import { Field, FieldDescription } from "@shaxsiy-oyin/ui/components/field";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AuthField } from "./AuthField";
import { emailSchema, passwordSchema, nameSchema } from "@/features/auth/lib/authSchemas";

interface RegisterFormProps {
  onSwitch: () => void;
  returnTo?: string;
}

export function RegisterForm({ onSwitch, returnTo }: RegisterFormProps) {
  const { signUp } = useAuth();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    validators: {
      onSubmit: z.object({
        name: nameSchema,
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
      <form.Field name='name'>
        {field => (
          <AuthField
            field={field}
            label='Ism'
            type='text'
            placeholder='Ali Valiyev'
            icon={User}
          />
        )}
      </form.Field>
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
                signUp(
                  form.getFieldValue("email"),
                  form.getFieldValue("password"),
                  form.getFieldValue("name"),
                  returnTo
                );
              }}
            >
              Ro&apos;yxatdan o&apos;tish
            </Button>
          </Field>
        )}
      </form.Subscribe>
      <Field>
        <FieldDescription className='text-center'>
          Hisobingiz bormi?{" "}
          <button
            type='button'
            onClick={onSwitch}
            className='underline underline-offset-4'
          >
            Kirish
          </button>
        </FieldDescription>
      </Field>
    </motion.div>
  );
}
