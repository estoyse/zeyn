import { motion } from "framer-motion";
import { Mail, Lock, User } from "lucide-react";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Input } from "@shaxsiy-oyin/ui/components/input";
import { useForm } from "@tanstack/react-form";
import z from "zod";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@shaxsiy-oyin/ui/components/field";
import { useAuth } from "@/hooks/useAuth";

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
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  const handleSubmit = form.handleSubmit;

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
          <Field>
            <FieldLabel htmlFor={field.name}>Ism</FieldLabel>
            <div className='relative'>
              <User className='absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground' />
              <Input
                id={field.name}
                type='text'
                placeholder='Ali Valiyev'
                className='pl-11'
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
                required
              />
            </div>
            {field.state.meta.errors.map(error => (
              <p key={error?.message} className='text-sm text-destructive'>
                {error?.message}
              </p>
            ))}
          </Field>
        )}
      </form.Field>
      <form.Field name='email'>
        {field => (
          <Field>
            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
            <div className='relative'>
              <Mail className='absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground' />
              <Input
                id={field.name}
                type='email'
                placeholder='sizning@email.com'
                className='pl-11'
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
                required
              />
            </div>
            {field.state.meta.errors.map(error => (
              <p key={error?.message} className='text-sm text-destructive'>
                {error?.message}
              </p>
            ))}
          </Field>
        )}
      </form.Field>
      <form.Field name='password'>
        {field => (
          <Field>
            <FieldLabel htmlFor={field.name}>Parol</FieldLabel>
            <div className='relative'>
              <Lock className='absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground' />
              <Input
                id={field.name}
                type='password'
                placeholder='••••••••'
                className='pl-11'
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
                required
              />
            </div>
            {field.state.meta.errors.map(error => (
              <p key={error?.message} className='text-sm text-destructive'>
                {error?.message}
              </p>
            ))}
          </Field>
        )}
      </form.Field>
      <form.Subscribe selector={state => state.canSubmit}>
        {() => (
          <Field>
            <Button
              type='submit'
              className='w-full'
              onClick={e => {
                e.preventDefault();
                handleSubmit();
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
