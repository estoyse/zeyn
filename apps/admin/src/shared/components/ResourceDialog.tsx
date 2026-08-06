import { Button } from "@zeyn/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@zeyn/ui/components/dialog";
import type { ReactNode } from "react";

interface ResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitLabel: string;
  isPending: boolean;
  onSubmit: () => void;
  children: ReactNode;
}

export function ResourceDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  isPending,
  onSubmit,
  children,
}: ResourceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className='grid gap-6'
          onSubmit={event => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>

          <div className='grid gap-4'>{children}</div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' variant='brand' disabled={isPending}>
              {isPending ? "Saving" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
