import { useNavigate } from "@tanstack/react-router";
import { Button } from "@zeyn/ui/components/button";
import { Card, CardContent } from "@zeyn/ui/components/card";
import { UserCircle2 } from "lucide-react";

interface LoginRequiredViewProps {
  gameId: string;
}

export function LoginRequiredView({ gameId }: LoginRequiredViewProps) {
  const navigate = useNavigate();

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <Card className='max-w-md w-full text-center'>
        <CardContent className='p-8'>
          <div className='mx-auto mb-6 flex size-16 items-center justify-center bg-brand/10 text-brand'>
            <UserCircle2 className='size-10' />
          </div>
          <div className='space-y-2'>
            <h1 className='text-2xl font-bold'>Login Required</h1>
            <p className='text-muted-foreground'>
              You must be logged in to participate in the game.
            </p>
          </div>
          <Button
            variant='brand'
            className='w-full mt-6'
            onClick={() =>
              (window.location.href = `/auth/login?redirectTo=/game/${gameId}`)
            }
          >
            Sign In to Play
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
