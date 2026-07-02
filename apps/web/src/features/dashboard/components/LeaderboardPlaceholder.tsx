import { Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zeyn/ui/components/card";

export function LeaderboardPlaceholder() {
  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base flex items-center gap-2'>
          <Trophy className='size-4' />
          Leaderboard
        </CardTitle>
        <CardDescription className='text-xs'>
          Global rankings are coming soon.
        </CardDescription>
      </CardHeader>
      <CardContent className='p-4'>
        <div className='text-xs text-muted-foreground text-center py-4 border-2 border-dashed bg-muted/50'>
          Coming soon.
        </div>
      </CardContent>
    </Card>
  );
}
