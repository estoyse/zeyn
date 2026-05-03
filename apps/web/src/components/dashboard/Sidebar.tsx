import { History, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";

export function Sidebar() {
  return (
    <aside className='space-y-8 h-fit sticky top-8'>
      <Card className='glass-card bg-primary/5 border-primary/20 overflow-hidden relative'>
        <div className='absolute top-0 right-0 size-32 bg-primary/10 blur-3xl -mr-16 -mt-16' />
        <CardHeader className='pb-2'>
          <CardTitle className='text-lg flex items-center gap-2 italic'>
            <History className='size-5 text-primary' />
            YOUR DEPLOYMENTS
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6 space-y-4'>
          <p className='text-xs text-muted-foreground italic'>
            Log into your previous match reports.
          </p>
          <div className='space-y-2'>
            {[1, 2].map(i => (
              <div
                key={i}
                className='p-3 rounded-xl bg-muted/40 border text-xs font-medium flex justify-between items-center group cursor-pointer hover:bg-muted transition-colors'
              >
                <span className='opacity-70'>#0042{i} - GALAXY ARENA</span>
                <ArrowRight className='size-3 opacity-0 group-hover:opacity-100 transition-all' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
