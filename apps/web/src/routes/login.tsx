import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { LayoutGrid } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(true);

  return (
    <div className="min-h-screen bg-[#050508] relative flex flex-col items-center justify-center p-4 overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10 space-y-4">
          <div className="w-16 h-16 bg-linear-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
             <LayoutGrid className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter">SHAXSIY OYIN</h1>
        </div>

        <div className="glass-card rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] -z-10 group-hover:bg-blue-500/10 transition-colors" />
          
          <AnimatePresence mode="wait">
            {showSignIn ? (
              <motion.div
                key="signin"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-8 text-center text-gray-500 text-sm font-medium">
          By continuing, you agree to our <span className="text-white hover:underline cursor-pointer">Terms of Service</span>.
        </p>
      </motion.div>
    </div>
  );
}
