import { Info } from "lucide-react";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Card, CardContent } from "@shaxsiy-oyin/ui/components/card";
import { roomLimits } from "@shaxsiy-oyin/api/game-types";

interface CreateSummaryProps {
  hasName: boolean;
  selectedCount: number;
  hasEnoughSubjects: boolean;
  isPublic: boolean;
  canCreate: boolean;
  isCreating: boolean;
  onCreate: () => void;
}

function Dot({ on }: { on: boolean }) {
  return (
    <div className={`size-2 rounded-full ${on ? "bg-white" : "bg-white/20"}`} />
  );
}

export function CreateSummary({
  hasName,
  selectedCount,
  hasEnoughSubjects,
  isPublic,
  canCreate,
  isCreating,
  onCreate,
}: CreateSummaryProps) {
  return (
    <div className='space-y-6 h-fit sticky top-8'>
      <Card className='bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative'>
        <div className='absolute top-0 right-0 size-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl' />
        <CardContent className='p-8 space-y-6 relative z-10'>
          <div className='space-y-4'>
            <h3 className='text-xl font-bold'>Ready to Create?</h3>
            <div className='space-y-2'>
              <div className='flex items-center gap-2 text-sm'>
                <Dot on={hasName} />
                Name set
              </div>
              <div className='flex items-center gap-2 text-sm'>
                <Dot on={hasEnoughSubjects} />
                Subjects selected ({selectedCount}/{roomLimits.minSubjects} min)
              </div>
              <div className='flex items-center gap-2 text-sm'>
                <Dot on />
                {isPublic ? "Public" : "Private"} room
              </div>
            </div>
          </div>

          <Button
            size='lg'
            variant='secondary'
            className='w-full'
            disabled={!canCreate || isCreating}
            onClick={onCreate}
          >
            {isCreating ? "Creating..." : "Create Game"}
          </Button>
        </CardContent>
      </Card>

      <Card className='bg-muted/50 border-dashed'>
        <CardContent className='p-6 flex gap-3'>
          <Info className='size-5 text-muted-foreground shrink-0 mt-1' />
          <p className='text-xs text-muted-foreground leading-relaxed'>
            Rooms are automatically archived after 1 hour of inactivity. Public
            rooms appear on the global dashboard and are searchable by all
            players.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
