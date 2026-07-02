import { motion } from "framer-motion";
import { Music2, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";
import { Skeleton } from "@shaxsiy-oyin/ui/components/skeleton";

interface Artist {
  id: string;
  name: string;
  artworkUrl?: string | null;
}

interface ArtistPickerProps {
  artists: Artist[];
  isLoading: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function ArtistPicker({
  artists,
  isLoading,
  selectedIds,
  onToggle,
}: ArtistPickerProps) {
  return (
    <Card className='glass-card'>
      <CardHeader className='bg-muted/30'>
        <CardTitle className='text-lg flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Music2 className='size-5 text-primary' />
            Select Artists
          </div>
          <div
            className={`text-xs px-2 py-1 rounded-full ${
              selectedIds.length === 0
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
            }`}
          >
            {selectedIds.length} SELECTED
          </div>
        </CardTitle>
        <CardDescription>
          Pick one or more artists. Songs are drawn from your selection.
        </CardDescription>
      </CardHeader>
      <CardContent className='p-6'>
        {isLoading ? (
          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-20 rounded-lg' />
            ))}
          </div>
        ) : artists.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            No artists available yet. Run the seed to load music.
          </p>
        ) : (
          <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
            {artists.map(a => {
              const selected = selectedIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => onToggle(a.id)}
                  className={`relative flex items-center gap-3 p-3 text-left border transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl overflow-hidden ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 bg-card"
                  }`}
                >
                  {a.artworkUrl ? (
                    <img
                      src={a.artworkUrl}
                      alt=''
                      className='size-10 rounded-md object-cover'
                    />
                  ) : (
                    <div className='flex size-10 items-center justify-center rounded-md bg-muted'>
                      <Music2 className='size-5 text-muted-foreground' />
                    </div>
                  )}
                  <span className='font-bold truncate'>{a.name}</span>
                  {selected && (
                    <div className='absolute top-2 right-2 text-primary'>
                      <CheckCircle2 className='size-4' />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
