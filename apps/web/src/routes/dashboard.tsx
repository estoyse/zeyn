import { useQuery, useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { motion } from "framer-motion";
import { 
  Plus, 
  Gamepad2, 
  Trophy, 
  Users, 
  History, 
  ChevronRight, 
  Search, 
  LayoutGrid,
  Zap
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const [roomToJoin, setRoomToJoin] = useState("");

  const createRoomMutation = useMutation(trpc.game.createRoom.mutationOptions());

  const handleCreateRoom = async () => {
    try {
      const { roomId } = await createRoomMutation.mutateAsync({ name: "My Game" });
      navigate({ to: `/game/${roomId}` });
    } catch (error: any) {
      toast.error("Failed to create room: " + error.message);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomToJoin.trim()) return;
    navigate({ to: `/game/${roomToJoin.trim()}` });
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight italic uppercase leading-none">
              COMMAND <span className="kinetic-text">CENTER</span>
            </h1>
            <p className="text-gray-500 font-medium text-lg flex items-center gap-2">
               Welcome back, <span className="text-white font-black">{session.data?.user.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase">Global Rank</span>
                <span className="text-2xl font-black">#2,481</span>
             </div>
             <div className="w-12 h-12 bg-linear-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <Trophy size={24} className="text-white" />
             </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_350px] gap-12">
          
          <div className="space-y-12">
            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 gap-6">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateRoom}
                disabled={createRoomMutation.isPending}
                className="group relative bg-linear-to-br from-blue-600 to-indigo-600 p-10 rounded-[40px] text-left shadow-2xl shadow-blue-600/20 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[60px] translate-x-1/2 -translate-y-1/2 rounded-full" />
                <div className="relative space-y-6">
                   <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center">
                      <Plus size={32} />
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-2xl font-black tracking-tight">CREATE PRIVATE ROOM</h3>
                      <p className="text-white/70 font-medium">Host a game with custom categories for up to 10 players.</p>
                   </div>
                   <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white/20 w-fit px-4 py-2 rounded-full">
                      Start Now <ChevronRight size={14} />
                   </div>
                </div>
              </motion.button>

              <div className="glass-card p-10 rounded-[40px] space-y-6 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-[60px] translate-x-1/2 -translate-y-1/2 rounded-full group-hover:bg-purple-500/10 transition-colors" />
                
                <div className="w-16 h-16 bg-purple-500/20 rounded-3xl flex items-center justify-center text-purple-400">
                   <Users size={32} />
                </div>
                <div className="space-y-4 relative">
                   <div className="space-y-1">
                      <h3 className="text-2xl font-black tracking-tight uppercase italic">JOIN A ROOM</h3>
                      <p className="text-gray-400 font-medium text-sm leading-relaxed">Enter a unique room code to join an ongoing session.</p>
                   </div>
                   
                   <form onSubmit={handleJoinRoom} className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                          value={roomToJoin}
                          onChange={(e) => setRoomToJoin(e.target.value)}
                          placeholder="ROOM CODE" 
                          className="w-full bg-white/5 border border-white/5 rounded-2xl h-14 pl-12 focus:border-purple-500/50 transition-all font-black text-sm tracking-widest" 
                        />
                      </div>
                      <button className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center hover:scale-105 transition-all shadow-lg active:scale-95">
                         <ChevronRight size={24} />
                      </button>
                   </form>
                </div>
              </div>
            </div>

            {/* Lifetime Stats */}
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <LayoutGrid size={20} className="text-blue-500" />
                  <h2 className="text-xl font-black uppercase tracking-[0.2em] text-gray-500">Service Reports</h2>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { label: "GAMES PLAYED", value: "142", icon: Gamepad2, color: "text-blue-400" },
                    { label: "WINS RECORDED", value: "38", icon: Trophy, color: "text-yellow-400" },
                    { label: "ACCURACY RATE", value: "76%", icon: Zap, color: "text-purple-400" }
                  ].map((s, i) => (
                    <div key={i} className="glass-card p-8 rounded-[32px] space-y-4 border-white/5 hover:border-white/10 transition-all">
                       <div className={`w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center ${s.color}`}>
                          <s.icon size={24} />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-500 tracking-widest uppercase">{s.label}</p>
                          <p className="text-3xl font-black italic">{s.value}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <div className="glass-card p-8 rounded-[40px] space-y-8 sticky top-32">
               <div className="flex items-center gap-4">
                  <History size={20} className="text-gray-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Match History</h3>
               </div>
               
               <div className="space-y-4">
                  {[1, 2, 3].map((m) => (
                    <div key={m} className="p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer group">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Victory</span>
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">2h ago</span>
                       </div>
                       <h4 className="font-bold text-sm group-hover:text-blue-400 transition-colors">Trivia Night #941</h4>
                       <div className="flex justify-between items-end mt-4">
                          <div className="flex -space-x-2">
                             {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-[#050508] bg-gray-800" />)}
                          </div>
                          <span className="text-lg font-black tracking-tight">1,250 pts</span>
                       </div>
                    </div>
                  ))}
               </div>

               <button className="w-full py-4 text-xs font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors">
                  View Full Logs
               </button>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
