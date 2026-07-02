import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@zeyn/ui/components/button";
import { EASE, viewport } from "@/features/landing/lib/motion";

export function CTA() {
  return (
    <section className='border-t relative overflow-hidden'>
      <div
        aria-hidden
        className='pointer-events-none absolute left-1/2 -top-20 h-96 w-[60rem] max-w-[130vw] -translate-x-1/2 bg-brand/15 blur-[120px]'
      />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 0.7, ease: EASE }}
        className='relative max-w-5xl mx-auto px-6 py-28 md:py-36 text-center'
      >
        <p className='text-xs font-mono uppercase tracking-widest text-brand mb-5'>
          Ready?
        </p>
        <h2 className='font-heading font-semibold uppercase tracking-tight leading-[0.9] text-5xl sm:text-6xl md:text-7xl lg:text-8xl'>
          <span className='block'>Your move.</span>
          <span
            className='block'
            style={{ WebkitTextStroke: "2px var(--brand)", color: "transparent" }}
          >
            Make it now.
          </span>
        </h2>
        <p className='mt-6 text-lg text-muted-foreground max-w-xl mx-auto'>
          Join thousands of players in live quiz battles. Create your first room
          in under a minute — no download, no cost.
        </p>
        <div className='mt-10 flex flex-col sm:flex-row items-center justify-center gap-4'>
          <Link to='/auth/login'>
            <Button variant='brand' size='lg' className='group w-full sm:w-auto'>
              Start Playing
              <ArrowRight className='size-4 ml-2 transition-transform group-hover:translate-x-1' />
            </Button>
          </Link>
          <Link to='/dashboard'>
            <Button variant='outline' size='lg' className='w-full sm:w-auto'>
              Explore games
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
