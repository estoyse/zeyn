import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge } from "@zeyn/ui/components/badge";
import { Button } from "@zeyn/ui/components/button";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { ConfirmDelete } from "@/shared/components/ConfirmDelete";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatCard } from "@/shared/components/StatCard";
import { formatDateTime } from "@/shared/lib/format";
import { trpc } from "@/shared/lib/trpc";
import { useAdminMutation } from "@/shared/lib/useAdminMutation";

export const Route = createFileRoute("/_admin/history/$historyId")({
  component: HistoryDetailPage,
});

function HistoryDetailPage() {
  const { historyId } = Route.useParams();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const detailQuery = useQuery(
    trpc.admin.rooms.getHistory.queryOptions({ historyId })
  );

  const deleteMutation = useAdminMutation(
    trpc.admin.rooms.deleteHistory.mutationOptions(),
    {
      successMessage: "Game record deleted",
      invalidate: [trpc.admin.rooms.listHistory.queryKey()],
      onDone: () => navigate({ to: "/history" }),
    }
  );

  const detail = detailQuery.data;
  const players = detail?.players ?? [];
  const results = detail?.questionResults ?? [];

  const byUser = new Map<string, typeof results>();
  for (const result of results) {
    const list = byUser.get(result.userId) ?? [];
    list.push(result);
    byUser.set(result.userId, list);
  }

  return (
    <div className='space-y-6'>
      <Link
        to='/history'
        className='inline-flex items-center gap-1.5 text-xs tracking-widest text-muted-foreground uppercase hover:text-foreground'
      >
        <ArrowLeft className='size-3.5' />
        History
      </Link>

      <PageHeader
        eyebrow={detail?.gameType ?? "Game"}
        title={detail ? `Room ${detail.gameId}` : "…"}
        description={
          detail
            ? `Hosted by ${detail.hostName ?? "unknown"} · ${formatDateTime(detail.createdAt)}`
            : undefined
        }
      >
        <Button variant='destructive' onClick={() => setDeleting(true)}>
          Delete record
        </Button>
      </PageHeader>

      {detail ? (
        <>
          <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
            <StatCard label='Players' value={players.length} />
            <StatCard label='Answers recorded' value={results.length} />
            <StatCard
              label='Top score'
              value={players[0]?.score ?? 0}
              hint={players[0]?.playerName}
            />
            <StatCard label='Subjects' value={detail.subjectNames.length} />
          </div>

          {detail.subjectNames.length > 0 ? (
            <div className='flex flex-wrap gap-1'>
              {detail.subjectNames.map(name => (
                <Badge key={name} tone='outline'>
                  {name}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className='border'>
            <p className='border-b bg-muted px-3 py-2 text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase'>
              Scoreboard
            </p>
            {players.length === 0 ? (
              <p className='p-4 text-sm text-muted-foreground'>
                No player results recorded.
              </p>
            ) : (
              <ul className='divide-y'>
                {players.map((player, index) => {
                  const answers = byUser.get(player.userId) ?? [];
                  const correct = answers.filter(a => a.correct).length;
                  return (
                    <li
                      key={player.id}
                      className='flex items-center justify-between gap-4 px-3 py-2.5 text-sm'
                    >
                      <span className='flex items-center gap-3'>
                        <span className='w-6 text-muted-foreground tabular-nums'>
                          {index + 1}
                        </span>
                        <span className='font-medium'>{player.playerName}</span>
                      </span>
                      <span className='flex items-center gap-4'>
                        {answers.length > 0 ? (
                          <span className='text-xs text-muted-foreground tabular-nums'>
                            {correct}/{answers.length} correct
                          </span>
                        ) : null}
                        <span className='font-semibold tabular-nums'>
                          {player.score}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      ) : null}

      <ConfirmDelete
        open={deleting}
        onOpenChange={setDeleting}
        title='Delete this game record?'
        description='Its scoreboard and per-question results go with it. This cannot be undone.'
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate({ historyId })}
      />
    </div>
  );
}
