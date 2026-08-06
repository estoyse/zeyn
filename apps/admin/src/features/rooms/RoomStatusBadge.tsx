import { Badge } from "@zeyn/ui/components/badge";

const TONE = {
  waiting: "warning",
  playing: "brand",
  finished: "default",
} as const;

export function RoomStatusBadge({ status }: { status: string }) {
  const tone = TONE[status as keyof typeof TONE] ?? "outline";
  return <Badge tone={tone}>{status}</Badge>;
}
