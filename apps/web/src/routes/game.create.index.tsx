import { createFileRoute } from "@tanstack/react-router";
import { Gamepad2 } from "lucide-react";
import { GameCatalog } from "@/features/games/components/GameCatalog";

export const Route = createFileRoute("/game/create/")({
  component: CreatePickerPage,
});

function CreatePickerPage() {
  return (
    <div className='min-h-screen bg-background p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-6xl space-y-8'>
        <header className='space-y-2'>
          <div className='flex items-center gap-3'>
            <div className='flex size-12 items-center justify-center bg-brand text-brand-foreground'>
              <Gamepad2 className='size-6' />
            </div>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>Choose a Game</h1>
              <p className='text-muted-foreground italic'>
                Pick a game to host, then configure your room.
              </p>
            </div>
          </div>
        </header>

        <GameCatalog />
      </div>
    </div>
  );
}
