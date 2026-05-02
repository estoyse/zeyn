import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useGame } from "../lib/game-client";
import { authClient } from "../lib/auth-client";
import { trpc } from "../utils/trpc";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Users, 
  Settings, 
  Play, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Clock,
  LayoutGrid,
  Crown,
  ChevronRight,
  UserCircle2
} from "lucide-react";

export const Route = createFileRoute("/game/$roomId")({
  component: GameComponent,
});

function Timer({ expiresAt, duration = 15000, onTimeout }: { expiresAt: number; duration?: number; onTimeout?: () => void }) {
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
    <div className="w-full space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
        <span className={isUrgent ? "text-red-400 animate-pulse" : ""}>{isUrgent ? "HURRY UP!" : "TIME REMAINING"}</span>
        <span>{(timeLeft / 1000).toFixed(1)}s</span>
      </div>
      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
        <motion.div 
          initial={false}
          animate={{ 
            width: `${percentage}%`,
            backgroundColor: isUrgent ? "#ef4444" : "#3b82f6"
          }}
          transition={{ type: "spring", bounce: 0, duration: 0.2 }}
          className="h-full rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)]"
        />
      </div>
    </div>
  );
}

function GameComponent() {
  const { roomId } = Route.useParams();
  const { data: session } = authClient.useSession();
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [answerInput, setAnswerInput] = useState("");
  
  const subjectsQuery = useQuery(trpc.game.getSubjects.queryOptions());

  const playerId = session?.user?.id || useMemo(() => "guest-" + Math.random().toString(36).slice(2, 9), []);
  const playerName = session?.user?.name || "Guest";

  const { state, error, sendAction } = useGame(roomId, playerId, playerName);

  if (error) return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-[32px] p-8 text-center space-y-4 backdrop-blur-xl"
      >
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
          <XCircle size={40} />
        </div>
        <h1 className="text-2xl font-black text-red-400">Connection Failed</h1>
        <p className="text-gray-400 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-red-600 rounded-2xl font-bold text-white shadow-lg hover:bg-red-500 transition-colors"
        >
          RETRY CONNECTION
        </button>
      </motion.div>
    </div>
  );

  if (!state) return (
    <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin-reverse" />
        </div>
      </div>
      <p className="text-blue-400 font-black tracking-widest text-sm animate-pulse">CONNECTING TO ROOM...</p>
    </div>
  );

  const isHost = state.hostId === playerId;
  const currentSubject = state.subjects[state.currentSubjectIndex];
  const currentQuestion = currentSubject?.questions[state.currentQuestionIndex];
  const isMyTurn = state.activeQuestionState?.buzzedPlayerId === playerId;

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleStart = () => {
    sendAction({ type: "START", playerId, subjectIds: selectedSubjectIds });
  };

  const handleBuzz = () => {
    sendAction({ type: "BUZZ", playerId });
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) return;
    sendAction({ type: "SUBMIT_ANSWER", playerId, answer: answerInput });
    setAnswerInput("");
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white selection:bg-blue-500/30 font-sans overflow-x-hidden">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-8 md:space-y-12">
        
        {/* Modern Navbar */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 pb-8 border-b border-white/5">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-linear-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <LayoutGrid className="text-white" size={24} />
             </div>
             <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">SHAXSIY OYIN</h1>
                <p className="text-[10px] font-black text-gray-500 tracking-[0.4em] uppercase mt-1 flex items-center gap-2">
                   <Clock size={10} /> Room: {roomId}
                </p>
             </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            {Object.values(state.players).map(p => (
              <motion.div 
                layout
                key={p.id} 
                className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${
                  p.id === state.activeQuestionState?.buzzedPlayerId 
                  ? 'bg-yellow-500/20 border-yellow-500/50 scale-105 shadow-xl shadow-yellow-500/10' 
                  : 'bg-white/5 border-white/5'
                }`}
              >
                <div className="relative">
                  <UserCircle2 size={32} className={p.connected ? "text-gray-300" : "text-gray-600 grayscale"} />
                  {p.connected && <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#050508]" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-500 uppercase leading-none mb-1">{p.name}</span>
                  <span className="text-lg font-black leading-none">{p.score}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {/* WAITING LOBBY */}
          {state.status === "WAITING" && (
            <motion.div 
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-[1fr_400px] gap-8"
            >
              <div className="space-y-8">
                <div className="bg-white/5 p-8 md:p-10 rounded-[40px] border border-white/5 backdrop-blur-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] -z-10 group-hover:bg-blue-500/10 transition-colors" />
                  
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-black flex items-center gap-4">
                      <Users className="text-blue-500" size={32} />
                      Players in Lobby
                    </h2>
                    <span className="bg-white/5 px-4 py-2 rounded-full text-xs font-black text-gray-400 border border-white/5">
                      {Object.keys(state.players).length} CONNECTED
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {Object.values(state.players).map(p => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={p.id} 
                        className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 hover:bg-white/[0.08] transition-all"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400">
                             <UserCircle2 size={24} />
                           </div>
                           <span className="font-black text-xl tracking-tight">{p.name}</span>
                        </div>
                        {p.id === state.hostId && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                             <Crown size={12} />
                             <span className="text-[10px] font-black uppercase tracking-wider">HOST</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="bg-linear-to-br from-blue-600/10 to-purple-600/10 p-8 rounded-[40px] border border-white/5 flex items-center gap-6">
                   <div className="w-16 h-16 bg-blue-500/20 rounded-3xl flex items-center justify-center text-blue-500 shrink-0">
                      <Settings size={32} />
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-xl font-bold italic">Game Configuration</h3>
                      <p className="text-gray-400 text-sm">Waiting for the match to be initialized with 5-10 categories.</p>
                   </div>
                </div>
              </div>

              {isHost ? (
                <div className="bg-white/5 p-8 rounded-[40px] border border-white/5 backdrop-blur-3xl flex flex-col h-fit sticky top-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
                      <LayoutGrid size={20} />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-widest">Select Subjects</h2>
                  </div>
                  
                  {subjectsQuery.isLoading ? (
                    <div className="py-20 flex items-center justify-center">
                      <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {subjectsQuery.data?.map((s: any) => (
                        <button
                          key={s.id}
                          onClick={() => toggleSubject(s.id)}
                          className={`w-full group flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border ${
                            selectedSubjectIds.includes(s.id) 
                            ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-600/20 scale-[0.98]' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                          }`}
                        >
                          <span className="font-bold tracking-tight">{s.name}</span>
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            selectedSubjectIds.includes(s.id) ? 'bg-white/20 text-white' : 'bg-white/5 text-transparent'
                          }`}>
                            <CheckCircle2 size={14} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={selectedSubjectIds.length < 5 || selectedSubjectIds.length > 10}
                    onClick={handleStart}
                    className="group relative w-full py-5 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl font-black text-xl shadow-2xl shadow-blue-600/20 disabled:opacity-30 disabled:grayscale transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <div className="flex items-center justify-center gap-3">
                       <Play size={24} fill="currentColor" />
                       START MATCH ({selectedSubjectIds.length})
                    </div>
                  </motion.button>
                  <p className="text-center mt-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Requires 5 to 10 subjects
                  </p>
                </div>
              ) : (
                <div className="bg-white/5 p-12 rounded-[40px] border border-white/5 backdrop-blur-3xl flex flex-col items-center justify-center text-center space-y-6 h-fit sticky top-8">
                  <div className="relative">
                    <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <Users size={40} className="text-blue-500 animate-bounce" />
                    </div>
                    <div className="absolute top-0 right-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-3 h-3 bg-purple-500 rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Waiting for Host</h2>
                    <p className="text-gray-400 font-medium leading-relaxed">
                      Sit tight! The host is currently selecting the subjects for the match.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ACTIVE GAME */}
          {state.status === "PLAYING" && (
            <motion.div 
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {/* Question Header */}
              <div className="flex flex-col items-center space-y-6 text-center">
                <motion.div 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="inline-flex items-center gap-4 bg-white/5 border border-white/5 px-8 py-3 rounded-full backdrop-blur-xl"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">Current Category</span>
                  <span className="text-xl font-black italic text-blue-400 underline underline-offset-4 decoration-2">{currentSubject?.name}</span>
                </motion.div>

                <div className="flex gap-3">
                  {[0, 1, 2, 3, 4].map(idx => (
                    <motion.div 
                      key={idx}
                      initial={false}
                      animate={{ 
                        width: idx === state.currentQuestionIndex ? 64 : 32,
                        backgroundColor: idx < state.currentQuestionIndex ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.05)"
                      }}
                      className="h-2 rounded-full border border-white/5"
                    />
                  ))}
                </div>
              </div>

              {/* Main Arena */}
              <div className="relative mx-auto max-w-5xl">
                <motion.div 
                  layout
                  className="bg-white/5 rounded-[64px] border border-white/5 p-8 md:p-16 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden min-h-[500px] flex flex-col items-center justify-center"
                >
                  {/* Phase Background Colors */}
                  <AnimatePresence>
                    {state.phase === "ANSWERING" && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-yellow-500/5 -z-10"
                      />
                    )}
                    {state.phase === "REVEALED" && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-green-500/5 -z-10"
                      />
                    )}
                  </AnimatePresence>

                  {/* ACTIVE PHASE (READING/BUZZING) */}
                  {state.phase === "ACTIVE" && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-full max-w-3xl text-center space-y-16"
                    >
                      <div className="space-y-4">
                         <span className="text-blue-500 font-black text-sm uppercase tracking-widest bg-blue-500/10 px-4 py-2 rounded-full">
                           Question worth {currentQuestion?.points}
                         </span>
                         <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tight drop-shadow-2xl">
                           {currentQuestion?.text}
                         </h2>
                      </div>
                      
                      <div className="space-y-10 flex flex-col items-center">
                        <div className="w-full max-w-sm">
                           <Timer expiresAt={state.activeQuestionState!.timerExpiresAt} duration={15000} />
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05, rotate: [0, -1, 1, 0] }}
                          whileTap={{ scale: 0.9 }}
                          disabled={state.activeQuestionState?.playersWhoAttempted.includes(playerId)}
                          onClick={handleBuzz}
                          className="group relative w-56 h-56 rounded-full bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:opacity-40 shadow-[0_20px_50px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center cursor-pointer"
                        >
                          <div className="absolute inset-0 rounded-full border-[10px] border-white/20 scale-105 group-hover:scale-110 transition-transform" />
                          <div className="absolute inset-0 rounded-full bg-linear-to-b from-white/20 to-transparent" />
                          <div className="flex flex-col items-center text-white">
                             <Zap size={64} fill="currentColor" className="mb-2 animate-pulse" />
                             <span className="text-4xl font-black drop-shadow-lg tracking-tighter">BUZZ!</span>
                          </div>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* ANSWERING PHASE */}
                  {state.phase === "ANSWERING" && (
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="w-full max-w-3xl text-center space-y-12"
                    >
                      <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-yellow-500 text-black text-xs font-black rounded-full uppercase tracking-widest shadow-lg shadow-yellow-500/20">
                          <Zap size={14} fill="currentColor" />
                          Awaiting Answer
                        </div>
                        <h2 className="text-3xl font-bold text-gray-400 italic leading-relaxed opacity-50 px-8">
                          {currentQuestion?.text}
                        </h2>
                      </div>

                      <div className="bg-white/5 p-10 rounded-[40px] border border-white/10 shadow-2xl backdrop-blur-2xl">
                        {isMyTurn ? (
                          <form onSubmit={handleSubmitAnswer} className="space-y-10">
                            <div className="space-y-2">
                               <input
                                autoFocus
                                value={answerInput}
                                onChange={(e) => setAnswerInput(e.target.value)}
                                placeholder="Type your answer..."
                                className="w-full bg-white/5 border-2 border-blue-500/30 rounded-[32px] px-8 py-6 text-3xl font-black focus:outline-none focus:border-blue-500 focus:ring-8 focus:ring-blue-500/10 transition-all text-center tracking-tight"
                              />
                              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Press ENTER to submit</p>
                            </div>
                            
                            <div className="flex items-center gap-8">
                              <Timer expiresAt={state.activeQuestionState!.timerExpiresAt} duration={20000} />
                              <button className="h-16 px-10 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black uppercase text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-95 shrink-0">
                                SUBMIT
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="py-12 space-y-8 flex flex-col items-center">
                             <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500">
                                <Clock size={40} className="animate-spin-slow" />
                             </div>
                             <div className="space-y-2">
                               <p className="text-3xl font-black text-yellow-500 tracking-tight">
                                 {state.players[state.activeQuestionState!.buzzedPlayerId!]?.name}
                               </p>
                               <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.3em]">Is thinking...</p>
                             </div>
                             <div className="w-full max-w-sm">
                                <Timer expiresAt={state.activeQuestionState!.timerExpiresAt} duration={20000} />
                             </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* REVEALED PHASE */}
                  {state.phase === "REVEALED" && (
                    <motion.div 
                      initial={{ scale: 1.1, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-full max-w-3xl text-center space-y-12"
                    >
                      <div className="space-y-6">
                        <p className="text-gray-500 uppercase font-black tracking-[0.4em] text-xs">Correct Answer</p>
                        <motion.h2 
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="text-6xl md:text-8xl font-black text-green-400 drop-shadow-[0_0_50px_rgba(74,222,128,0.5)] tracking-tighter"
                        >
                          {currentQuestion?.answer}
                        </motion.h2>
                      </div>
                      
                      <div className="pt-20 flex flex-col items-center space-y-4">
                         <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: "100%" }}
                              animate={{ width: "0%" }}
                              transition={{ duration: 5, ease: "linear" }}
                              className="h-full bg-blue-500"
                            />
                         </div>
                         <p className="text-gray-500 font-black uppercase text-[10px] tracking-widest">
                           Next question starts shortly
                         </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* GAME OVER SCREEN */}
          {state.status === "FINISHED" && (
            <motion.div 
              key="finished"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-5xl mx-auto space-y-12"
            >
              <div className="text-center space-y-4">
                <div className="inline-block p-4 bg-yellow-500/10 rounded-3xl mb-4">
                   <Trophy size={64} className="text-yellow-500" />
                </div>
                <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter bg-linear-to-b from-white via-white to-white/20 bg-clip-text text-transparent">
                  MATCH OVER
                </h1>
                <p className="text-blue-400 text-xl font-black uppercase tracking-[0.4em]">The Ultimate Stats</p>
              </div>

              <div className="grid md:grid-cols-[1fr_400px] gap-8">
                {/* Stats Table */}
                <div className="bg-white/5 rounded-[48px] border border-white/5 p-8 md:p-12 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] -z-10" />
                  
                  <div className="flex items-center gap-4 mb-10">
                     <LayoutGrid size={24} className="text-blue-500" />
                     <h2 className="text-2xl font-black uppercase tracking-tight">Leaderboard</h2>
                  </div>

                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-white/5">
                        <th className="pb-6 text-gray-500 uppercase font-black tracking-widest text-[10px]">Rank</th>
                        <th className="pb-6 text-gray-500 uppercase font-black tracking-widest text-[10px]">Player</th>
                        <th className="pb-6 text-right text-gray-500 uppercase font-black tracking-widest text-[10px]">Final Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Object.values(state.players).sort((a, b) => b.score - a.score).map((p, idx) => (
                        <motion.tr 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          key={p.id} 
                          className={`group hover:bg-white/5 transition-colors ${idx === 0 ? 'text-yellow-400' : ''}`}
                        >
                          <td className="py-6 font-black italic text-3xl opacity-20 group-hover:opacity-100 transition-opacity">
                             {idx + 1}
                          </td>
                          <td className="py-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                                idx === 0 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-white/5 border-white/5'
                              }`}>
                                 {idx === 0 ? <Crown size={24} /> : <UserCircle2 size={24} className="text-gray-500" />}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xl font-black tracking-tight">{p.name}</span>
                                {idx === 0 && <span className="text-[9px] font-black uppercase tracking-widest">Grand Champion</span>}
                              </div>
                            </div>
                          </td>
                          <td className="py-6 text-right">
                             <span className="text-4xl font-black tabular-nums">{p.score}</span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Actions / Highlights */}
                <div className="space-y-6">
                   <div className="bg-linear-to-br from-blue-600 to-purple-600 p-8 rounded-[40px] shadow-2xl shadow-blue-600/20 space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black italic">Victory Lap</h3>
                        <p className="text-white/70 text-sm font-medium">Amazing performance! Share your results with your friends or start a new rematch.</p>
                      </div>
                      <button 
                        onClick={() => window.location.href = '/'}
                        className="w-full py-5 bg-white text-black rounded-3xl font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-xl"
                      >
                        New Game
                      </button>
                   </div>

                   <div className="bg-white/5 p-8 rounded-[40px] border border-white/5 backdrop-blur-xl">
                      <h4 className="text-xs font-black uppercase text-gray-500 tracking-[0.3em] mb-6">Quick Stats</h4>
                      <div className="space-y-4">
                         <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm font-medium">Subjects Played</span>
                            <span className="font-black">{state.subjects.length}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm font-medium">Avg Score</span>
                            <span className="font-black">
                              {Math.round(Object.values(state.players).reduce((acc, p) => acc + p.score, 0) / Object.keys(state.players).length)}
                            </span>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Scrollbar CSS */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-reverse {
          animation: spin-reverse 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
