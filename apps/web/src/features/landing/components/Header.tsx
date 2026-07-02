import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Link } from "@tanstack/react-router";
import { Gamepad2 } from "lucide-react";
import { ModeToggle } from "@/shared/components/mode-toggle";
import { authClient } from "@/features/auth/lib/auth-client";

const LINKS = [
  { name: "Play", to: "/dashboard" },
  { name: "Tournaments", to: "/" },
  { name: "Leaderboard", to: "/" },
];

export function Header() {
  const { data: session } = authClient.useSession();

  return (
    <header className='border-b bg-background'>
      <div className='max-w-7xl mx-auto px-6 py-4'>
        <div className='flex items-center justify-between'>
          <Link to='/' className='flex items-center gap-2'>
            <div className="w-8 h-8 bg-primary flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className='text-lg font-medium'>Shaxsiy O'yin</span>
          </Link>

          <nav className='hidden md:flex items-center gap-8'>
            {LINKS.map(link => (
              <Link
                key={link.name}
                to={link.to}
                className='text-sm text-muted-foreground hover:text-foreground transition-colors'
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className='flex items-center gap-3'>
            <ModeToggle />
            {session ? (
              <Link to="/dashboard">
                <Button variant="brand">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/auth/login">
                <Button variant="brand">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
