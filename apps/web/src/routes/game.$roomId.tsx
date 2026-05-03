import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useGame } from "../lib/game-client";
import { authClient } from "../lib/auth-client";
import { trpc } from "../utils/trpc";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Trophy,
  Users,
  Play,
  Zap,
  XCircle,
  Clock,
  LayoutGrid,
  Crown,
  UserCircle2,
  Lock,
  Shield,
  Info,
} from "lucide-react";

import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Input } from "@shaxsiy-oyin/ui/components/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";

export const Route = createFileRoute("/game/$roomId")({
  component: GamePage,
});

function Timer({
  expiresAt,
  duration = 15000,
  onTimeout,
}: {
  expiresAt: number;
  duration?: number;
  onTimeout?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, expiresAt - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onTimeout?.();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [expiresAt, onTimeout]);

  const percentage = Math.min(100, (timeLeft / duration) * 100);
  const isUrgent = timeLeft < 5000;

  return (
    <div className='w-full space-y-2'>
      <div className='flex justify-between text-xs text-muted-foreground'>
        <span className={isUrgent ? "text-destructive animate-pulse" : ""}>
          {isUrgent ? "HURRY UP!" : "TIME REMAINING"}
        </span>
        <span>{(timeLeft / 1000).toFixed(1)}s</span>
      </div>
      <div className='w-full h-3 bg-muted overflow-hidden border p-[2px] rounded-full'>
        <motion.div
          initial={false}
          animate={{
            width: `${percentage}%`,
            backgroundColor: isUrgent
              ? "oklch(0.577 0.245 27.325)"
              : "oklch(0.627 0.265 303.9)",
          }}
          transition={{ duration: 0.2 }}
          className='h-full rounded-full'
        />
      </div>
    </div>
  );
}

function GamePage() {
  const { roomId } = Route.useParams();
  const { data: session, isPending } = authClient.useSession();
  const [password, setPassword] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const navigate = useNavigate();

  const playerId = session?.user?.id;
  const playerName = session?.user?.name;

  const { state, error, errorCode, sendAction } = useGame(
    roomId,
    playerId!,
    playerName!,
    password
  );

  const resultsQuery = useQuery(trpc.game.getResults.queryOptions({ roomId }));

  if ((error || !state) && resultsQuery.data) {
    const dbResults = resultsQuery.data;
    return (
      <div className='min-h-screen bg-background p-6 md:p-12'>
        <div className='mx-auto max-w-5xl space-y-8 py-12'>
          <div className='text-center space-y-4'>
            <div className='mx-auto inline-block bg-primary/10 p-4 rounded-2xl'>
              <Trophy className='size-12 text-primary' />
            </div>
            <h1 className='text-4xl md:text-6xl font-black italic tracking-tighter'>
              MATCH RESULTS
            </h1>
            <p className='text-muted-foreground uppercase tracking-widest text-xs font-bold'>
              Fetched from Archive
            </p>
          </div>

          <Card className='glass-card'>
            <CardHeader>
              <CardTitle className='italic font-black flex items-center gap-2'>
                <LayoutGrid className='size-5 text-primary' />
                LEADERBOARD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className='w-full'>
                <thead>
                  <tr className='border-b text-left'>
                    <th className='pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest'>
                      Rank
                    </th>
                    <th className='pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest'>
                      Player
                    </th>
                    <th className='pb-4 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest'>
                      Final Score
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {dbResults.results.map((p: any, idx: number) => (
                    <tr
                      key={p.id}
                      className={`hover:bg-muted/50 transition-colors ${
                        idx === 0 ? "text-primary bg-primary/5" : ""
                      }`}
                    >
                      <td className='py-6 font-black italic text-3xl opacity-20'>
                        {idx + 1}
                      </td>
                      <td className='py-6'>
                        <div className='flex items-center gap-4'>
                          <div
                            className={`flex size-10 items-center justify-center border rounded-lg ${
                              idx === 0
                                ? "bg-primary/10 border-primary/20"
                                : "bg-muted border-border"
                            }`}
                          >
                            {idx === 0 ? (
                              <Crown className='size-5 fill-current' />
                            ) : (
                              <UserCircle2 className='size-5 text-muted-foreground' />
                            )}
                          </div>
                          <span className='font-black italic uppercase'>
                            {p.playerName}
                          </span>
                        </div>
                      </td>
                      <td className='py-4 text-right'>
                        <span className='text-3xl font-black italic tracking-tighter tabular-nums'>
                          {p.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className='text-center'>
            <Button
              onClick={() => navigate({ to: "/dashboard" })}
              className='font-bold uppercase tracking-widest italic'
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (errorCode === "PASSWORD_REQUIRED") {
      setShowPasswordPrompt(true);
    }
  }, [errorCode]);

  if (isPending) {
    return (
      <div className='min-h-screen bg-background flex flex-col items-center justify-center gap-4'>
        <div className='size-16 border-4 border-primary/20 border-t-primary ranimate-spin rounded-full' />
        <p className='text-sm text-muted-foreground animate-pulse font-black italic'>
          CHECKING SESSION...
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center p-4'>
        <Card className='max-w-md w-full text-center'>
          <CardContent className='p-8'>
            <div className='mx-auto mb-6 flex size-16 items-center justify-center bg-primary/10 rounded-2xl'>
              <UserCircle2 className='size-10 text-primary' />
            </div>
            <div className='space-y-2'>
              <h1 className='text-2xl font-bold italic tracking-tighter'>
                LOGIN REQUIRED
              </h1>
              <p className='text-muted-foreground'>
                You must be logged in to participate in the arena.
              </p>
            </div>
            <Button
              className='w-full mt-6 font-bold'
              onClick={() =>
                (window.location.href = `/auth/login?redirectTo=/game/${roomId}`)
              }
            >
              Sign In to Play
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showPasswordPrompt) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center p-4'>
        <Card className='max-w-md w-full glass-card'>
          <CardHeader className='text-center'>
            <div className='mx-auto size-12 bg-destructive/10 rounded-xl flex items-center justify-center mb-4 border border-destructive/20'>
              <Lock className='size-6 text-destructive' />
            </div>
            <CardTitle className='italic font-black text-2xl'>
              SECURE ARENA
            </CardTitle>
            <CardDescription>
              This room is locked. Enter the passcode to proceed.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Input
              type='password'
              placeholder='Enter password...'
              value={password}
              onChange={e => setPassword(e.target.value)}
              className='text-center h-12'
              autoFocus
            />
            {error && errorCode !== "PASSWORD_REQUIRED" && (
              <p className='text-xs text-destructive text-center font-bold'>
                {error}
              </p>
            )}
            <Button
              className='w-full h-12 font-black italic'
              onClick={() => setShowPasswordPrompt(false)}
            >
              VERIFY & ENTER
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isHost = state?.hostId === playerId;
  const currentSubject = state?.subjects?.[state?.currentSubjectIndex ?? 0];
  const currentQuestion =
    currentSubject?.questions?.[state?.currentQuestionIndex ?? 0];
  const isMyTurn = state?.activeQuestionState?.buzzedPlayerId === playerId;

  if (error && errorCode !== "PASSWORD_REQUIRED" && !state) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center p-4'>
        <Card className='max-w-md w-full text-center glass-card border-destructive/20'>
          <CardContent className='p-8 space-y-4'>
            <div className='mx-auto flex size-16 items-center justify-center bg-destructive/10 rounded-2xl'>
              <XCircle className='size-10 text-destructive' />
            </div>
            <h1 className='text-2xl font-black italic text-destructive'>
              CONNECTION FAILED
            </h1>
            <p className='text-muted-foreground'>{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant='outline'
              className='font-bold'
            >
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!state) {
    return (
      <div className='min-h-screen bg-background flex flex-col items-center justify-center gap-4'>
        <div className='relative'>
          <div className='size-16 border-4 border-primary/20 border-t-primary ranimate-spin rounded-full' />
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='size-10 border-4 border-secondary/20 border-t-secondary animate-spin rounded-full' />
          </div>
        </div>
        <p className='text-sm text-muted-foreground animate-pulse uppercase tracking-widest font-black italic'>
          ESTABLISHING SECURE CONNECTION...
        </p>
      </div>
    );
  }

  const handleStart = () => {
    sendAction({
      type: "START",
      playerId: playerId!,
      subjectIds: [],
    });
  };

  const handleBuzz = () => {
    sendAction({ type: "BUZZ", playerId: playerId! });
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) return;
    sendAction({
      type: "SUBMIT_ANSWER",
      playerId: playerId!,
      answer: answerInput,
    });
    setAnswerInput("");
  };

  return (
    <div className='min-h-screen bg-background p-4 md:p-6'>
      <div className='mx-auto max-w-7xl space-y-6 md:space-y-8'>
        <header className='flex flex-col md:flex-row justify-between items-center gap-4 pb-6 border-b'>
          <div className='flex items-center gap-3'>
            <div className='flex size-10 items-center justify-center bg-primary rounded-lg'>
              <LayoutGrid className='size-5 text-primary-foreground' />
            </div>
            <div>
              <h1 className='text-xl font-bold tracking-tight uppercase italic'>
                {state.roomName || "Shaxsiy O'yin"}
              </h1>
              <p className='text-[10px] text-muted-foreground flex items-center gap-1 font-bold'>
                <Shield className='size-3' /> ID: {roomId.slice(0, 8)} |{" "}
                {state.isPublic ? "PUBLIC" : "PRIVATE"}
              </p>
            </div>
          </div>

          <div className='flex flex-wrap justify-center gap-2'>
            {Object.values(state.players).map(p => (
              <motion.div
                layout
                key={p.id}
                className={`flex items-center gap-2 px-4 py-2 border transition-all rounded-xl ${
                  p.id === state.activeQuestionState?.buzzedPlayerId
                    ? "bg-primary/10 border-primary scale-105 shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                    : "bg-muted/50 border-border"
                }`}
              >
                <div className='relative'>
                  <UserCircle2
                    className={
                      p.connected
                        ? "text-foreground"
                        : "text-muted-foreground grayscale"
                    }
                  />
                  {p.connected && (
                    <div className='absolute -top-0.5 -right-0.5 size-2.5 bg-green-500 border-2 border-background rounded-full' />
                  )}
                </div>
                <div className='flex flex-col'>
                  <span className='text-[10px] text-muted-foreground font-bold uppercase'>
                    {p.name}
                  </span>
                  <span className='font-black italic'>{p.score}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </header>

        <AnimatePresence mode='wait'>
          {state.status === "WAITING" && (
            <motion.div
              key='lobby'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='grid gap-6 lg:grid-cols-[1fr_350px]'
            >
              <div className='space-y-6'>
                <Card className='glass-card'>
                  <CardHeader className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='flex items-center gap-2 text-2xl font-black italic'>
                        <Users className='size-6 text-primary' />
                        ARENA LOBBY
                      </CardTitle>
                      <div className='px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black'>
                        {Object.keys(state.players).length} / {state.maxPlayers}{" "}
                        DEPLOYED
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='grid gap-3 sm:grid-cols-2'>
                      {Object.values(state.players).map(p => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          key={p.id}
                          className='flex items-center justify-between border bg-muted/20 p-4 rounded-xl'
                        >
                          <div className='flex items-center gap-3'>
                            <div className='flex size-10 items-center justify-center bg-muted rounded-lg'>
                              <UserCircle2 className='size-5 text-muted-foreground' />
                            </div>
                            <span className='font-bold uppercase tracking-tight'>
                              {p.name}
                            </span>
                          </div>
                          {p.id === state.hostId && (
                            <div className='flex items-center gap-1 bg-primary/10 px-2 py-1 rounded text-[10px] font-black text-primary'>
                              <Crown className='size-3' />
                              HOST
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className='bg-muted/10 border-dashed'>
                  <CardContent className='flex items-center gap-4 p-6'>
                    <div className='flex size-12 items-center justify-center bg-primary/10 rounded-xl'>
                      <Info className='size-6 text-primary' />
                    </div>
                    <div>
                      <p className='font-bold italic uppercase tracking-tighter'>
                        Mission Briefing
                      </p>
                      <p className='text-xs text-muted-foreground leading-relaxed'>
                        Match consists of {state.subjects.length} categories.
                        Each category has 5 questions worth 10-50 points. Buzz
                        first to answer. Correct adds points, incorrect
                        subtracts them.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <aside className='space-y-6'>
                <Card className='h-fit sticky top-4 border-primary/20 bg-primary/5'>
                  <CardHeader>
                    <CardTitle className='text-lg font-black italic'>
                      INTEL PANEL
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    <div className='space-y-3'>
                      <p className='text-[10px] font-black text-muted-foreground uppercase tracking-widest'>
                        Active Subjects
                      </p>
                      <div className='flex flex-wrap gap-2'>
                        {state.subjects.map(s => (
                          <div
                            key={s.id}
                            className='px-3 py-1.5 bg-background border rounded-lg text-xs font-bold shadow-sm italic'
                          >
                            {s.name}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <p className='text-[10px] font-black text-muted-foreground uppercase tracking-widest'>
                        Share Entry Point
                      </p>
                      <div className='flex gap-2'>
                        <Input
                          readOnly
                          value={window.location.href}
                          className='text-[10px] h-9 bg-background/50 font-mono'
                        />
                        <Button
                          size='sm'
                          variant='secondary'
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success("Link copied!");
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>

                    {isHost ? (
                      <Button
                        className='w-full h-14 text-lg font-black italic'
                        onClick={handleStart}
                        disabled={Object.keys(state.players).length < 2}
                      >
                        <Play className='size-5 mr-2 fill-current' />
                        DEPLOY MATCH
                      </Button>
                    ) : (
                      <div className='flex flex-col items-center gap-3 p-6 text-center bg-muted/30 rounded-2xl border border-dashed'>
                        <div className='size-2 bg-primary rounded-full animate-ping' />
                        <p className='text-xs font-bold text-muted-foreground uppercase tracking-widest'>
                          Awaiting Commander's Signal...
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </aside>
            </motion.div>
          )}

          {state.status === "PLAYING" && (
            <motion.div
              key='game'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='space-y-8'
            >
              <div className='flex flex-col items-center gap-4 text-center'>
                <div className='flex items-center gap-2 bg-muted px-6 py-2 rounded-xl border'>
                  <div className='size-2 bg-primary animate-pulse rounded-full' />
                  <span className='text-[10px] font-black text-muted-foreground uppercase tracking-widest'>
                    Current Category
                  </span>
                  <span className='font-black italic text-primary underline decoration-2 underline-offset-4 uppercase'>
                    {currentSubject?.name}
                  </span>
                </div>

                <div className='flex gap-2'>
                  {[0, 1, 2, 3, 4].map(idx => (
                    <motion.div
                      key={idx}
                      initial={false}
                      animate={{
                        width: idx === state.currentQuestionIndex ? 24 : 12,
                        backgroundColor:
                          idx < state.currentQuestionIndex
                            ? "oklch(0% 0 0 / 0.1)"
                            : idx === state.currentQuestionIndex
                            ? "oklch(0.627 0.265 303.9)"
                            : "oklch(0.963 0.002 197.1)",
                      }}
                      className='h-2 border rounded-full'
                    />
                  ))}
                </div>
              </div>

              <Card className='mx-auto max-w-3xl glass-card'>
                <CardContent className='p-6 md:p-10 flex flex-col items-center justify-center gap-6'>
                  <AnimatePresence mode='wait'>
                    {state.phase === "ACTIVE" && (
                      <motion.div
                        key='active'
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.1, opacity: 0 }}
                        className='w-full text-center space-y-6'
                      >
                        <div className='space-y-2'>
                          <span className='inline-block bg-primary/10 px-3 py-1 text-xs font-black italic text-primary rounded-lg border border-primary/20'>
                            WORTH {currentQuestion?.points} PTS
                          </span>
                          <h2 className='text-2xl md:text-4xl font-black italic tracking-tighter'>
                            {currentQuestion?.text}
                          </h2>
                        </div>

                        <div className='w-full max-w-sm mx-auto'>
                          <Timer
                            expiresAt={
                              state.activeQuestionState!.timerExpiresAt
                            }
                            duration={15000}
                          />
                        </div>

                        <Button
                          size='lg'
                          variant='destructive'
                          className='size-40 rounded-full border-8 border-background shadow-2xl shadow-destructive/20 group'
                          onClick={handleBuzz}
                          disabled={state.activeQuestionState?.playersWhoAttempted.includes(
                            playerId!
                          )}
                        >
                          <div className='flex flex-col items-center group-hover:scale-110 transition-transform'>
                            <Zap className='size-12 mb-1 fill-current' />
                            <span className='text-3xl font-black italic tracking-widest'>
                              BUZZ!
                            </span>
                          </div>
                        </Button>
                      </motion.div>
                    )}

                    {state.phase === "ANSWERING" && (
                      <motion.div
                        key='answering'
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className='w-full space-y-6'
                      >
                        <div className='space-y-2 text-center'>
                          <span className='inline-flex items-center gap-1 bg-yellow-500/10 px-4 py-1.5 text-xs font-black italic text-yellow-500 rounded-lg border border-yellow-500/20'>
                            <Zap className='size-3 fill-current' />
                            AWAITING TRANSMISSION
                          </span>
                        </div>

                        <Card className='max-w-lg mx-auto glass-card'>
                          {isMyTurn ? (
                            <CardContent className='p-8 space-y-6'>
                              <form
                                onSubmit={handleSubmitAnswer}
                                className='space-y-6'
                              >
                                <Input
                                  value={answerInput}
                                  onChange={e => setAnswerInput(e.target.value)}
                                  placeholder='IDENTIFY TARGET...'
                                  className='text-center text-2xl h-16 font-black italic uppercase tracking-widest border-2 focus-visible:ring-primary'
                                  autoFocus
                                />
                                <div className='flex flex-col items-center gap-4'>
                                  <Timer
                                    expiresAt={
                                      state.activeQuestionState!.timerExpiresAt
                                    }
                                    duration={20000}
                                  />
                                  <Button
                                    type='submit'
                                    size='lg'
                                    className='w-full font-black italic text-lg h-14'
                                  >
                                    SUBMIT ANSWER
                                  </Button>
                                </div>
                              </form>
                            </CardContent>
                          ) : (
                            <CardContent className='flex flex-col items-center gap-6 p-10 text-center'>
                              <div className='relative'>
                                <div className='flex size-20 items-center justify-center bg-muted rounded-2xl animate-pulse'>
                                  <Clock className='size-10 text-muted-foreground animate-spin' />
                                </div>
                              </div>
                              <div className='space-y-2'>
                                <p className='text-2xl font-black italic uppercase'>
                                  {state.players[
                                    state.activeQuestionState!.buzzedPlayerId!
                                  ]?.name ?? "Player"}
                                </p>
                                <p className='text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]'>
                                  Is calculating...
                                </p>
                              </div>
                              <div className='w-full max-w-xs'>
                                <Timer
                                  expiresAt={
                                    state.activeQuestionState!.timerExpiresAt
                                  }
                                  duration={20000}
                                />
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      </motion.div>
                    )}

                    {state.phase === "REVEALED" && (
                      <motion.div
                        key='revealed'
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className='w-full text-center space-y-8'
                      >
                        <div className='space-y-2'>
                          <p className='text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]'>
                            Verified Intel
                          </p>
                          <motion.h2
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className='text-5xl md:text-7xl font-black italic text-green-500 tracking-tighter'
                          >
                            {currentQuestion?.answer}
                          </motion.h2>
                        </div>

                        <div className='flex flex-col items-center gap-4 pt-4'>
                          <div className='h-1.5 w-full max-w-md bg-muted overflow-hidden rounded-full'>
                            <motion.div
                              initial={{ width: "100%" }}
                              animate={{ width: "0%" }}
                              transition={{ duration: 5, ease: "linear" }}
                              className='h-full bg-primary'
                            />
                          </div>
                          <p className='text-[10px] text-muted-foreground font-black uppercase tracking-widest'>
                            Next tactical objective in 5s
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {state.status === "FINISHED" && (
            <motion.div
              key='finished'
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className='mx-auto space-y-8'
            >
              <div className='text-center space-y-4'>
                <div className='mx-auto inline-block bg-primary/10 p-6 rounded-3xl border border-primary/20'>
                  <Trophy className='size-16 text-primary' />
                </div>
                <h1 className='text-5xl md:text-7xl font-black italic tracking-tighter'>
                  VICTORY ARCHIVE
                </h1>
              </div>

              <div className='grid gap-8 md:grid-cols-[1fr_350px]'>
                <Card className='glass-card'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-3 text-2xl font-black italic'>
                      <LayoutGrid className='size-6 text-primary' />
                      LEADERBOARD
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <table className='w-full'>
                      <thead>
                        <tr className='border-b text-left'>
                          <th className='pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest'>
                            Rank
                          </th>
                          <th className='pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest'>
                            Player
                          </th>
                          <th className='pb-4 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest'>
                            Score
                          </th>
                        </tr>
                      </thead>
                      <tbody className='divide-y'>
                        {Object.values(state.players)
                          .sort((a, b) => b.score - a.score)
                          .map((p, idx) => (
                            <motion.tr
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              key={p.id}
                              className={`hover:bg-muted/30 transition-colors ${
                                idx === 0 ? "text-primary bg-primary/5" : ""
                              }`}
                            >
                              <td className='py-6 font-black italic text-3xl opacity-20'>
                                {idx + 1}
                              </td>
                              <td className='py-6'>
                                <div className='flex items-center gap-4'>
                                  <div
                                    className={`flex size-12 items-center justify-center rounded-xl border ${
                                      idx === 0
                                        ? "bg-primary/10 border-primary/20"
                                        : "bg-muted/50 border-border"
                                    }`}
                                  >
                                    {idx === 0 ? (
                                      <Crown className='size-6 fill-current' />
                                    ) : (
                                      <UserCircle2 className='size-6 text-muted-foreground' />
                                    )}
                                  </div>
                                  <span className='font-black italic uppercase text-lg'>
                                    {p.name}
                                  </span>
                                </div>
                              </td>
                              <td className='py-6 text-right'>
                                <span className='text-4xl font-black italic tracking-tighter tabular-nums'>
                                  {p.score}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                <div className='space-y-6'>
                  <Card className='bg-primary text-primary-foreground border-none shadow-2xl shadow-primary/20 overflow-hidden relative'>
                    <div className='absolute top-0 right-0 size-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl' />
                    <CardContent className='p-8 space-y-6 relative z-10'>
                      <div>
                        <p className='text-3xl font-black italic tracking-tighter uppercase'>
                          Mission Success
                        </p>
                        <p className='text-sm opacity-80 font-medium italic mt-1'>
                          Operational efficiency confirmed.
                        </p>
                      </div>
                      <Button
                        variant='secondary'
                        className='w-full h-14 font-black italic tracking-widest'
                        onClick={() => (window.location.href = "/dashboard")}
                      >
                        NEW DEPLOYMENT
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className='glass-card'>
                    <CardHeader>
                      <CardDescription className='text-[10px] font-black uppercase tracking-widest'>
                        Post-Match Intel
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='flex justify-between items-center p-3 bg-muted/30 rounded-xl'>
                        <span className='text-muted-foreground text-xs font-bold'>
                          Categories
                        </span>
                        <span className='font-black italic'>
                          {state.subjects.length}
                        </span>
                      </div>
                      <div className='flex justify-between items-center p-3 bg-muted/30 rounded-xl'>
                        <span className='text-muted-foreground text-xs font-bold'>
                          Avg Score
                        </span>
                        <span className='font-black italic text-primary'>
                          {Math.round(
                            Object.values(state.players).reduce(
                              (acc, p) => acc + p.score,
                              0
                            ) / Object.keys(state.players).length
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
