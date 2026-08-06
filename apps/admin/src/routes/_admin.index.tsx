import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/shared/components/PageHeader";
import { trpc } from "@/shared/lib/trpc";

export const Route = createFileRoute("/_admin/")({
  component: DashboardPage,
});

function DashboardPage() {
  const whoami = useQuery(trpc.admin.whoami.queryOptions());

  return (
    <div className='space-y-6'>
      <PageHeader
        eyebrow='Overview'
        title='Dashboard'
        description='Content, moderation and activity for Zeyn.'
      />

      <div className='border p-6'>
        <p className='text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase'>
          Server-verified identity
        </p>
        <p className='mt-2 text-sm'>
          {whoami.isLoading
            ? "Checking…"
            : whoami.data
              ? `${whoami.data.email} — role ${whoami.data.role}`
              : "Unavailable"}
        </p>
      </div>
    </div>
  );
}
