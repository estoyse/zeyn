import { Card, CardContent } from "@shaxsiy-oyin/ui/components/card";

export function Terminal() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b text-xs text-muted-foreground bg-muted">
          Terminal — shaxsiy-oyin
        </div>
        <CardContent className="p-6 font-mono text-sm">
          <div className="text-foreground">
            <span className="text-muted-foreground">$</span> shaxsiy-oyin
          </div>
          <div className="text-primary mt-2">
            {">"} /join "championship tournament"
          </div>
          <div className="text-muted-foreground mt-4 space-y-1">
            <div>Searching for tournaments...</div>
            <div>Found 23 active games with 1.2K+ players</div>
            <div>Loading 12 new tournaments...</div>
          </div>
          <div className="text-success mt-4 space-y-1">
            <div>✓ Game session initialized</div>
            <div>✓ Matchmaking complete</div>
            <div>✓ Ready to play</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}