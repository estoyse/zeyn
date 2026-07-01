import { History, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@shaxsiy-oyin/ui/components/card";

export function Sidebar() {
  return (
    <aside className="space-y-6 h-fit sticky top-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="size-4" />
            Recent Games
          </CardTitle>
          <CardDescription className="text-xs">
            View your game history and results.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          <div className="text-xs text-muted-foreground text-center py-4">
            No games played yet.
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}