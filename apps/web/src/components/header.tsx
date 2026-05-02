import { Link } from "@tanstack/react-router";
import { LayoutGrid, UserCircle2, Bell } from "lucide-react";
import UserMenu from "./user-menu";
import { motion } from "framer-motion";

export default function Header() {
  const links = [
    { to: "/", label: "HOME" },
    { to: "/dashboard", label: "DASHBOARD" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#050508]/80 backdrop-blur-2xl border-b border-white/5">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <LayoutGrid size={20} className="text-white" />
            </div>
            <span className="text-xl font-black italic tracking-tighter">SHAXSIY OYIN</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {links.map(({ to, label }) => (
              <Link 
                key={to} 
                to={to}
                className="text-[11px] font-black tracking-[0.2em] text-gray-500 hover:text-white transition-colors [&.active]:text-blue-400"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-white/5 rounded-full border border-white/5">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">System Online</span>
          </div>

          <button className="text-gray-500 hover:text-white transition-colors relative">
            <Bell size={20} />
            <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full border border-[#050508]" />
          </button>

          <div className="h-8 w-px bg-white/10" />

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
