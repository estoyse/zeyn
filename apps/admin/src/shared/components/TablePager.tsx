import { Button } from "@zeyn/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { formatNumber } from "@/shared/lib/format";

interface TablePagerProps {
  total: number;
  limit: number;
  offset: number;
  onOffsetChange: (offset: number) => void;
}

export function TablePager({
  total,
  limit,
  offset,
  onOffsetChange,
}: TablePagerProps) {
  if (total <= limit) return null;

  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);

  return (
    <nav className='flex items-center justify-between gap-4 border border-t-0 px-3 py-2'>
      <p className='text-xs text-muted-foreground tabular-nums'>
        {formatNumber(from)}–{formatNumber(to)} of {formatNumber(total)}
      </p>
      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          size='icon-sm'
          disabled={page <= 1}
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
        >
          <ChevronLeft />
          <span className='sr-only'>Previous page</span>
        </Button>
        <span className='text-xs tracking-widest uppercase tabular-nums'>
          {page} / {pages}
        </span>
        <Button
          variant='outline'
          size='icon-sm'
          disabled={page >= pages}
          onClick={() => onOffsetChange(offset + limit)}
        >
          <ChevronRight />
          <span className='sr-only'>Next page</span>
        </Button>
      </div>
    </nav>
  );
}
