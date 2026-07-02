import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Link } from "@tanstack/react-router";
import { Gamepad2 } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ModeToggle } from "@/shared/components/mode-toggle";
import { authClient } from "@/features/auth/lib/auth-client";

const LINKS = [
  { name: "Games", to: "/#games" },
  { name: "How it works", to: "/#how" },
  { name: "Play", to: "/dashboard" },
];

export function Header() {
  const { data: session } = authClient.useSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className='max-w-7xl mx-auto px-6 py-4'>
        <div className='flex items-center justify-between'>
          <Link to='/' className='group flex items-center gap-2.5'>
            <div className='w-8 h-8 bg-brand flex items-center justify-center transition-transform group-hover:-translate-y-0.5'>
              <Gamepad2 className='w-5 h-5 text-brand-foreground' />
            </div>
            <span className='text-lg font-heading font-semibold tracking-tight'>
              Shaxsiy O'yin
            </span>
          </Link>

          <nav className='hidden md:flex items-center gap-8'>
            {LINKS.map(link => (
              <a
                key={link.name}
                href={link.to}
                className='relative text-sm text-muted-foreground hover:text-foreground transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-brand after:transition-all hover:after:w-full'
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className='flex items-center gap-3'>
            <ModeToggle />
            {session ? (
              <Link to='/dashboard'>
                <Button variant='brand'>Dashboard</Button>
              </Link>
            ) : (
              <Link to='/auth/login'>
                <Button variant='brand'>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
