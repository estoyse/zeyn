import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Zap, PlusCircle, ArrowRight } from "lucide-react";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Input } from "@shaxsiy-oyin/ui/components/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";

export function QuickActions() {
  const navigate = useNavigate();
  const [roomToJoin, setRoomToJoin] = useState("");

  const handleJoinRoom = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!roomToJoin.trim()) return;
    navigate({ to: "/game/$roomId", params: { roomId: roomToJoin.trim() } });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card
        className="group hover:border-primary/50 transition-all cursor-pointer"
        onClick={() => navigate({ to: "/game/create" })}
      >
        <CardHeader>
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Zap className="size-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Create Game</CardTitle>
          <CardDescription>
            Host a new game with your chosen subjects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">
            Create
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      <Card className="group hover:border-primary/50 transition-all">
        <CardHeader>
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <PlusCircle className="size-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Join by ID</CardTitle>
          <CardDescription>
            Have a room ID? Enter it below to join.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleJoinRoom} className="flex gap-2">
            <Input
              placeholder="Enter Room ID..."
              value={roomToJoin}
              onChange={(e) => setRoomToJoin(e.target.value)}
              className="h-10"
            />
            <Button type="submit" size="sm" disabled={!roomToJoin}>
              Join
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}