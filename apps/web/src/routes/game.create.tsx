import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "../utils/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Users,
  Lock,
  Globe,
  Shield,
  Zap,
  CheckCircle2,
  Settings2,
  Info,
} from "lucide-react";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Input } from "@shaxsiy-oyin/ui/components/input";
import { Checkbox } from "@shaxsiy-oyin/ui/components/checkbox";
import { Label } from "@shaxsiy-oyin/ui/components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";

export const Route = createFileRoute("/game/create")({
  component: CreateGamePage,
});

function CreateGamePage() {
  const navigate = useNavigate();
  const subjectsQuery = useQuery(trpc.game.getSubjects.queryOptions());
  const createRoomMutation = useMutation(
    trpc.game.createRoom.mutationOptions()
  );

  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (selectedSubjectIds.length < 5 || selectedSubjectIds.length > 10) return;

    try {
      const { gameId } = await createRoomMutation.mutateAsync({
        name,
        maxPlayers,
        isPublic,
        password: password || undefined,
        subjectIds: selectedSubjectIds,
      });
      navigate({ to: "/game/$gameId", params: { gameId } });
    } catch (e) {
      console.error("Failed to create room", e);
    }
  };

  const canCreate =
    name.length >= 3 &&
    selectedSubjectIds.length >= 5 &&
    selectedSubjectIds.length <= 10;

  return (
    <div className='min-h-screen bg-background p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-6xl space-y-8'>
        <header className='space-y-2'>
          <div className='flex items-center gap-3'>
            <div className='flex size-12 items-center justify-center bg-primary rounded-xl'>
              <Settings2 className='size-6 text-primary-foreground' />
            </div>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>
                Setup Your Arena
              </h1>
              <p className='text-muted-foreground italic'>
                Configure the battlefield before deploying.
              </p>
            </div>
          </div>
        </header>

        <div className='grid gap-8 lg:grid-cols-[1fr_400px]'>
          <div className='space-y-8'>
            {/* General Settings */}
            <Card className='glass-card overflow-hidden'>
              <CardHeader className='bg-muted/30'>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <LayoutGrid className='size-5 text-primary' />
                  General Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6 space-y-6'>
                <div className='space-y-2'>
                  <Label htmlFor='room-name'>Room Name</Label>
                  <Input
                    id='room-name'
                    placeholder='Enter a glorious name...'
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className='text-lg h-12'
                  />
                  <p className='text-xs text-muted-foreground'>
                    Minimum 3 characters. Visible to players.
                  </p>
                </div>

                <div className='grid gap-6 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label className='flex items-center gap-2'>
                      <Users className='size-4' /> Max Players
                    </Label>
                    <Input
                      type='number'
                      min={2}
                      max={20}
                      value={maxPlayers}
                      onChange={e => setMaxPlayers(parseInt(e.target.value))}
                    />
                  </div>
                  <div className='space-y-4 pt-8'>
                    <div className='flex items-center justify-between p-3 rounded-lg border bg-muted/20'>
                      <div className='space-y-0.5'>
                        <Label className='flex items-center gap-2'>
                          {isPublic ? (
                            <Globe className='size-4 text-primary' />
                          ) : (
                            <Lock className='size-4 text-destructive' />
                          )}
                          {isPublic ? "Public Lobby" : "Private Arena"}
                        </Label>
                        <p className='text-[10px] text-muted-foreground'>
                          {isPublic
                            ? "Visible on dashboard"
                            : "Invite only via link"}
                        </p>
                      </div>
                      <Checkbox
                        id='public-toggle'
                        checked={isPublic}
                        onCheckedChange={checked => setIsPublic(!!checked)}
                      />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {!isPublic && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className='space-y-2 overflow-hidden'
                    >
                      <Label className='flex items-center gap-2'>
                        <Shield className='size-4 text-primary' /> Room Password
                        (Optional)
                      </Label>
                      <Input
                        type='password'
                        placeholder='Secure your borders...'
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Subject Selection */}
            <Card className='glass-card'>
              <CardHeader className='bg-muted/30'>
                <CardTitle className='text-lg flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Zap className='size-5 text-primary' />
                    Select Subjects
                  </div>
                  <div
                    className={`text-xs px-2 py-1 rounded-full ${
                      selectedSubjectIds.length < 5
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {selectedSubjectIds.length} / 10 SELECTED
                  </div>
                </CardTitle>
                <CardDescription>
                  Choose 5-10 categories for the match.
                </CardDescription>
              </CardHeader>
              <CardContent className='p-6'>
                {subjectsQuery.isLoading ? (
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div
                        key={i}
                        className='h-20 bg-muted animate-pulse rounded-lg'
                      />
                    ))}
                  </div>
                ) : (
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                    {subjectsQuery.data?.map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => toggleSubject(s.id)}
                        className={`relative p-4 text-left border transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl overflow-hidden group ${
                          selectedSubjectIds.includes(s.id)
                            ? "border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                            : "border-border hover:border-primary/50 bg-card"
                        }`}
                      >
                        <div className='relative z-10 space-y-1'>
                          <p className='font-bold truncate'>{s.name}</p>
                          <p className='text-[10px] text-muted-foreground uppercase tracking-widest'>
                            Category
                          </p>
                        </div>
                        {selectedSubjectIds.includes(s.id) && (
                          <motion.div
                            layoutId='check'
                            className='absolute top-2 right-2 text-primary'
                          >
                            <CheckCircle2 className='size-4' />
                          </motion.div>
                        )}
                        <div
                          className={`absolute bottom-0 left-0 h-1 transition-all ${
                            selectedSubjectIds.includes(s.id)
                              ? "w-full bg-primary"
                              : "w-0 bg-primary/20 group-hover:w-full"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className='space-y-6 h-fit sticky top-8'>
            <Card className='bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative'>
              <div className='absolute top-0 right-0 size-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl' />
              <CardContent className='p-8 space-y-6 relative z-10'>
                <div className='space-y-4'>
                  <h3 className='text-xl font-bold'>Ready to Create?</h3>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2 text-sm'>
                      <div
                        className={`size-2 rounded-full ${
                          name.length >= 3 ? "bg-white" : "bg-white/20"
                        }`}
                      />
                      Name set
                    </div>
                    <div className='flex items-center gap-2 text-sm'>
                      <div
                        className={`size-2 rounded-full ${
                          selectedSubjectIds.length >= 5
                            ? "bg-white"
                            : "bg-white/20"
                        }`}
                      />
                      Subjects selected ({selectedSubjectIds.length}/5 min)
                    </div>
                    <div className='flex items-center gap-2 text-sm'>
                      <div className='size-2 rounded-full bg-white' />
                      {isPublic ? "Public" : "Private"} room
                    </div>
                  </div>
                </div>

                <Button
                  size='lg'
                  variant='secondary'
                  className='w-full'
                  disabled={!canCreate || createRoomMutation.isPending}
                  onClick={handleCreate}
                >
                  {createRoomMutation.isPending ? "Creating..." : "Create Game"}
                </Button>
              </CardContent>
            </Card>

            <Card className='bg-muted/50 border-dashed'>
              <CardContent className='p-6 flex gap-3'>
                <Info className='size-5 text-muted-foreground shrink-0 mt-1' />
                <p className='text-xs text-muted-foreground leading-relaxed'>
                  Rooms are automatically archived after 1 hour of inactivity.
                  Public rooms appear on the global dashboard and are searchable
                  by all players.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
