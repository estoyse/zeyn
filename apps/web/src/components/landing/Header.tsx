import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Link } from "@tanstack/react-router";
import { Gamepad2, Menu, ChevronDown } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
const LINKS = [
  {
    name: "O'yinlar",
    to: "/games",
  },
  {
    name: "Narxlar",
    to: "/prices",
  },
  {
    name: "Yana",
    to: "/more",
  },
];
export function Header() {
  return (
    <header className='border-b border-black/10 bg-background'>
      <div className='max-w-6xl mx-auto px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 bg-black rounded flex items-center justify-center'>
              <Gamepad2 className='w-5 h-5 text-white' />
            </div>
            <span className='text-lg font-medium'>Shaxsiy O'yin</span>
          </div>

          <nav className='hidden md:flex items-center gap-8'>
            {LINKS.map(link => (
              <Link
                key={link.name}
                to={link.to}
                className='hover:opacity-60 transition-opacity'
              >
                {link.name}
              </Link>
            ))}
            <Button
              variant='ghost'
              className='flex items-center gap-1 text-sm hover:opacity-60 transition-opacity'
            >
              Yana
              <ChevronDown className='w-4 h-4' />
            </Button>
          </nav>

          <div className='flex items-center gap-3'>
            <ModeToggle />
            <Link to='/auth/login'>
              <Button>Boshlash</Button>
            </Link>
            <Button variant={"outline"} className='md:hidden'>
              <Menu className='w-5 h-5' />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
