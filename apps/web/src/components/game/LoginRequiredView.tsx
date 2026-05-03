import { useNavigate } from "@tanstack/react-router";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import {
  Card,
  CardContent,
} from "@shaxsiy-oyin/ui/components/card";
import { UserCircle2 } from "lucide-react";

interface LoginRequiredViewProps {
  roomId: string;
}

export function LoginRequiredView({ roomId }: LoginRequiredViewProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="p-8">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center bg-primary/10 rounded-lg">
            <UserCircle2 className="size-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Login Required</h1>
            <p className="text-muted-foreground">
              You must be logged in to participate in the game.
            </p>
          </div>
          <Button
            className="w-full mt-6"
            onClick={() => window.location.href = `/auth/login?redirectTo=/game/${roomId}`}
          >
            Sign In to Play
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}