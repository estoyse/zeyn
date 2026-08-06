import { Field, FieldLabel } from "@zeyn/ui/components/field";
import { Input } from "@zeyn/ui/components/input";
import { Textarea } from "@zeyn/ui/components/textarea";

interface FieldApiLike<TValue> {
  name: string;
  state: {
    value: TValue;
    meta: { errors: unknown[] };
  };
  handleBlur: () => void;
  handleChange: (value: TValue) => void;
}

function errorText(errors: unknown[]): string | null {
  const messages = errors
    .map(error =>
      typeof error === "string"
        ? error
        : ((error as { message?: string } | null)?.message ?? "")
    )
    .filter(Boolean);
  return messages.length ? messages.join(", ") : null;
}

interface TextFieldProps {
  field: FieldApiLike<string>;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}

export function TextField({
  field,
  label,
  placeholder,
  multiline,
  rows = 4,
}: TextFieldProps) {
  const error = errorText(field.state.meta.errors);
  const Control = multiline ? Textarea : Input;

  return (
    <Field>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Control
        id={field.name}
        name={field.name}
        placeholder={placeholder}
        rows={multiline ? rows : undefined}
        aria-invalid={error ? true : undefined}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={event => field.handleChange(event.target.value)}
      />
      {error ? <p className='text-xs text-destructive'>{error}</p> : null}
    </Field>
  );
}

interface NumberFieldProps {
  field: FieldApiLike<number>;
  label: string;
  min?: number;
  max?: number;
}

export function NumberField({ field, label, min, max }: NumberFieldProps) {
  const error = errorText(field.state.meta.errors);

  return (
    <Field>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type='number'
        min={min}
        max={max}
        aria-invalid={error ? true : undefined}
        value={Number.isNaN(field.state.value) ? "" : field.state.value}
        onBlur={field.handleBlur}
        onChange={event => field.handleChange(event.target.valueAsNumber)}
      />
      {error ? <p className='text-xs text-destructive'>{error}</p> : null}
    </Field>
  );
}
