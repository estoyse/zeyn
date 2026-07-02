import type { ReactNode } from "react";
import { Check, Info, Rocket } from "lucide-react";
import { Button } from "@zeyn/ui/components/button";
import { Card } from "@zeyn/ui/components/card";

export interface DeployCheck {
  label: ReactNode;
  done: boolean;
}

interface DeployPanelProps {
  checks: DeployCheck[];
  canCreate: boolean;
  isCreating: boolean;
  onCreate: () => void;
  note?: ReactNode;
}

export function DeployPanel({
  checks,
  canCreate,
  isCreating,
  onCreate,
  note,
}: DeployPanelProps) {
  const doneCount = checks.filter(c => c.done).length;

  return (
    <div className="sticky top-8 h-fit space-y-4">
      <Card className="gap-0 overflow-hidden py-0">
        <div className="h-1 w-full bg-brand" />
        <div className="space-y-5 p-6">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Deployment
            </p>
            <h3 className="font-heading text-xl font-semibold uppercase tracking-wide">
              Ready to Create?
            </h3>
          </div>

          <ul className="space-y-2.5">
            {checks.map((c, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex size-5 shrink-0 items-center justify-center border transition-colors ${
                    c.done
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border text-transparent"
                  }`}
                >
                  <Check className="size-3.5" />
                </span>
                <span className={c.done ? "text-foreground" : "text-muted-foreground"}>
                  {c.label}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              Checklist
            </span>
            <span className="font-heading text-sm tabular-nums">
              {doneCount}/{checks.length}
            </span>
          </div>

          <div className="space-y-2">
            <Button
              size="lg"
              variant="brand"
              className="w-full"
              disabled={!canCreate || isCreating}
              onClick={onCreate}
            >
              <Rocket className="mr-2 size-4" />
              {isCreating ? "Creating..." : "Create Game"}
            </Button>
            {!canCreate && !isCreating && (
              <p className="text-center text-xs text-muted-foreground">
                Complete the checklist to deploy.
              </p>
            )}
          </div>
        </div>
      </Card>

      {note && (
        <Card className="gap-0 border-dashed bg-muted/50 py-0">
          <div className="flex gap-3 p-5">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground">{note}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
