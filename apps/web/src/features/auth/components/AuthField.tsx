import type { AnyFieldApi } from "@tanstack/react-form";
import type { LucideIcon } from "lucide-react";
import { Field, FieldLabel } from "@shaxsiy-oyin/ui/components/field";
import { Input } from "@shaxsiy-oyin/ui/components/input";

interface AuthFieldProps {
  field: AnyFieldApi;
  label: string;
  type: string;
  placeholder: string;
  icon: LucideIcon;
}

export function AuthField({
  field,
  label,
  type,
  placeholder,
  icon: Icon,
}: AuthFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <Input
          id={field.name}
          type={type}
          placeholder={placeholder}
          className="pl-11"
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={e => field.handleChange(e.target.value)}
          required
        />
      </div>
      {field.state.meta.errors.map(
        (error: { message?: string } | undefined) => (
          <p key={error?.message} className="text-sm text-destructive">
            {error?.message}
          </p>
        )
      )}
    </Field>
  );
}
