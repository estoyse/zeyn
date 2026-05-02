import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { trpc } from "@/utils/trpc";
import { motion } from "framer-motion";
import { Zap, Trophy, Users, Play, ChevronRight, LayoutGrid } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());

  return (
    <div className="min-h-screen bg-[#050508] relative overflow-hidden">
      
      {/* Kinetic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <main className="relative container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center space-y-12">
          
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-xl"
          >
            <div className={`w-2 h-2 rounded-full ${healthCheck.data ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-red-500 shadow-[0_0_10px_#ef4444]"} animate-pulse`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              {healthCheck.isLoading ? "Checking Status..." : "Live Game Servers Online"}
            </span>
          </motion.div>

          {/* Hero Content */}
          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-7xl md:text-9xl font-black italic tracking-tighter leading-[0.9]"
            >
              SHAXSIY <br />
              <span className="kinetic-text">OYIN</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed"
            >
              The ultimate high-stakes trivia experience. Compete in real-time, buzz-in faster than your friends, and dominate the leaderboard.
            </motion.p>
          </div>

          {/* Call to Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <Link 
              to="/dashboard"
              className="group relative px-10 py-5 bg-white text-black rounded-3xl font-black text-xl flex items-center gap-3 hover:scale-105 transition-all active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
            >
              <Play size={24} fill="currentColor" />
              START PLAYING
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              to="/login"
              className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-3xl font-black text-xl hover:bg-white/10 transition-all backdrop-blur-xl"
            >
              LOG IN
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-3 gap-8 w-full pt-20"
          >
            {[
              { icon: Zap, title: "Real-Time", desc: "Low-latency WebSocket sync for instant buzzing." },
              { icon: Trophy, title: "Competitive", desc: "Ranked matches with detailed stats and leaderboards." },
              { icon: Users, title: "Multiplayer", desc: "Private rooms for 5-10 players with custom subjects." }
            ].map((f, i) => (
              <div key={i} className="glass-card p-8 rounded-[40px] text-left space-y-4 group hover:border-white/20 transition-all">
                <div className="w-14 h-14 bg-linear-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                   <f.icon size={28} />
                </div>
                <h3 className="text-xl font-black">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Background Decor */}
      <div className="absolute bottom-0 left-0 w-full h-64 bg-linear-to-t from-blue-600/10 to-transparent pointer-events-none" />
    </div>
  );
}
