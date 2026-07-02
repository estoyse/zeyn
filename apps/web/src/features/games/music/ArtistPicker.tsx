import { Music2, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zeyn/ui/components/card";
import { Badge } from "@zeyn/ui/components/badge";
import { Skeleton } from "@zeyn/ui/components/skeleton";

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
    <Card>
      <CardHeader className='bg-muted/50'>
        <CardTitle className='text-lg flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Music2 className='size-5 text-brand' />
            Select Artists
          </div>
          <Badge tone={selectedIds.length === 0 ? "destructive" : "brand"}>
            {selectedIds.length} Selected
          </Badge>
        </CardTitle>
        <CardDescription>
          Pick one or more artists. Songs are drawn from your selection.
        </CardDescription>
      </CardHeader>
      <CardContent className='p-6'>
        {isLoading ? (
          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-20 rounded-none' />
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
                  className={`group flex items-center gap-3 p-3 text-left border transition-colors active:translate-y-px overflow-hidden ${
                    selected
                      ? "border-brand bg-brand/10"
                      : "border-border bg-card hover:border-brand/50 hover:bg-muted/50"
                  }`}
                >
                  {a.artworkUrl ? (
                    <img
                      src={a.artworkUrl}
                      alt=''
                      className='size-12 shrink-0 object-cover'
                    />
                  ) : (
                    <div className='flex size-12 shrink-0 items-center justify-center bg-muted'>
                      <Music2 className='size-5 text-muted-foreground' />
                    </div>
                  )}
                  <span className='truncate text-sm font-semibold'>{a.name}</span>
                  <span
                    className={`ml-auto flex size-5 shrink-0 items-center justify-center border transition-colors ${
                      selected
                        ? "border-brand bg-brand text-brand-foreground"
                        : "border-border text-transparent group-hover:border-brand/50"
                    }`}
                  >
                    <Check className='size-3.5' />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
