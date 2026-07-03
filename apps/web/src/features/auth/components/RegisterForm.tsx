import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AtSign, Check, Loader2, Mail, Lock, User, X } from "lucide-react";
import { Button } from "@zeyn/ui/components/button";
import { Input } from "@zeyn/ui/components/input";
import { Field, FieldDescription, FieldLabel } from "@zeyn/ui/components/field";
import { useForm, useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import z from "zod";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { trpc } from "@/shared/lib/trpc";
import { AuthField } from "./AuthField";
import {
  emailSchema,
  newPasswordSchema,
  nameSchema,
} from "@/features/auth/lib/authSchemas";

interface RegisterFormProps {
  onSwitch: () => void;
  returnTo?: string;
}

function slugifyUsername(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
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
        password: newPasswordSchema,
      }),
    },
  });

  const nameValue = useStore(form.store, state => state.values.name);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);

  const suggestion = slugifyUsername(nameValue);
  const effectiveUsername = usernameTouched ? usernameInput : suggestion;

  const [debounced, setDebounced] = useState(effectiveUsername);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(effectiveUsername), 400);
    return () => clearTimeout(timer);
  }, [effectiveUsername]);

  const checkQuery = useQuery({
    ...trpc.profile.checkUsername.queryOptions({ username: debounced }),
    enabled: debounced.length > 0,
  });

  const status = useMemo(() => {
    if (effectiveUsername.trim().length === 0) return "empty" as const;
    if (effectiveUsername !== debounced || checkQuery.isFetching)
      return "checking" as const;
    if (checkQuery.data?.available) return "available" as const;
    return "unavailable" as const;
  }, [effectiveUsername, debounced, checkQuery.isFetching, checkQuery.data]);

  const usernameOk = status === "empty" || status === "available";

  const handleRegister = () => {
    form.handleSubmit();
    signUp(
      form.getFieldValue("email"),
      form.getFieldValue("password"),
      form.getFieldValue("name"),
      effectiveUsername.trim() || undefined,
      returnTo
    );
  };

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

      <Field>
        <FieldLabel
          htmlFor='username'
          className='text-xs uppercase tracking-widest text-muted-foreground'
        >
          Foydalanuvchi nomi
        </FieldLabel>
        <div className='relative'>
          <AtSign className='absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground' />
          <Input
            id='username'
            type='text'
            placeholder='ali_valiyev'
            className='pl-11 pr-10'
            autoCapitalize='none'
            spellCheck={false}
            value={effectiveUsername}
            onChange={e => {
              setUsernameTouched(true);
              setUsernameInput(e.target.value.toLowerCase().replace(/\s/g, ""));
            }}
          />
          <div className='absolute right-3 top-1/2 -translate-y-1/2'>
            {status === "checking" && (
              <Loader2 className='size-4 animate-spin text-muted-foreground' />
            )}
            {status === "available" && <Check className='size-4 text-brand' />}
            {status === "unavailable" && (
              <X className='size-4 text-destructive' />
            )}
          </div>
        </div>
        <FieldDescription>
          {status === "unavailable"
            ? (checkQuery.data && "reason" in checkQuery.data
                ? checkQuery.data.reason
                : "Band qilingan.")
            : "Ixtiyoriy — bo‘sh qoldirsangiz, biz taklif qilamiz."}
        </FieldDescription>
      </Field>

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
        {canSubmit => (
          <Field>
            <Button
              type='submit'
              variant='brand'
              className='w-full'
              disabled={!canSubmit || !usernameOk}
              onClick={e => {
                e.preventDefault();
                handleRegister();
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
