import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Badge } from "@zeyn/ui/components/badge";
import { AlertTriangle } from "lucide-react";

import { PageHeader } from "@/shared/components/PageHeader";
import { StatCard } from "@/shared/components/StatCard";
import { RoomStatusBadge } from "@/features/rooms/RoomStatusBadge";
import { formatDate, formatRelative } from "@/shared/lib/format";
import { trpc } from "@/shared/lib/trpc";

export const Route = createFileRoute("/_admin/")({
  component: DashboardPage,
});

function DashboardPage() {
  const overview = useQuery(trpc.admin.stats.overview.queryOptions());
  const health = useQuery(trpc.admin.stats.contentHealth.queryOptions());
  const rooms = useQuery({
    ...trpc.admin.stats.liveRooms.queryOptions({ limit: 5 }),
    refetchInterval: 10000,
  });
  const signups = useQuery(
    trpc.admin.stats.recentSignups.queryOptions({ limit: 5 })
  );
  const games = useQuery(trpc.admin.stats.recentGames.queryOptions({ limit: 5 }));
  const breakdown = useQuery(trpc.admin.stats.gameTypeBreakdown.queryOptions());

  const data = overview.data;
  const loading = overview.isLoading;
  const thinSubjects = health.data?.thinSubjects ?? [];
  const thinArtists = health.data?.thinArtists ?? [];

  return (
    <div className='space-y-6'>
      <PageHeader
        eyebrow='Overview'
        title='Dashboard'
        description='Content, people and activity at a glance.'
      />

      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <StatCard
          label='Users'
          value={data?.users}
          isLoading={loading}
          hint={data ? `+${data.newUsers7d} this week` : undefined}
        />
        <StatCard
          label='Live rooms'
          value={data?.liveRooms}
          isLoading={loading}
          hint='waiting or playing'
        />
        <StatCard
          label='Games played'
          value={data?.gamesPlayed}
          isLoading={loading}
          hint={data ? `${data.gamesPlayed7d} this week` : undefined}
        />
        <StatCard
          label='Banned'
          value={data?.banned}
          isLoading={loading}
          hint={data ? `${data.admins} admin(s)` : undefined}
        />
        <StatCard
          label='Subjects'
          value={data?.subjects}
          isLoading={loading}
          hint={data ? `${data.questions} questions` : undefined}
        />
        <StatCard
          label='Artists'
          value={data?.artists}
          isLoading={loading}
          hint={data ? `${data.songs} songs` : undefined}
        />
        <StatCard
          label='New users 30d'
          value={data?.newUsers30d}
          isLoading={loading}
        />
        <StatCard
          label='Game types'
          value={breakdown.data?.length}
          isLoading={breakdown.isLoading}
          hint={breakdown.data
            ?.slice(0, 2)
            .map(row => `${row.gameType} ${row.value}`)
            .join(" · ")}
        />
      </div>

      {thinSubjects.length > 0 || thinArtists.length > 0 ? (
        <div className='border border-warning/40 bg-warning/10 p-4'>
          <p className='flex items-center gap-2 text-[10px] font-black tracking-[0.3em] text-warning uppercase'>
            <AlertTriangle className='size-3.5' />
            Content health
          </p>
          {thinSubjects.length > 0 ? (
            <p className='mt-2 text-sm'>
              {thinSubjects.length} subject(s) below{" "}
              {health.data?.minQuestionsPerSubject} questions:{" "}
              {thinSubjects.slice(0, 5).map(subject => (
                <Link
                  key={subject.id}
                  to='/subjects/$subjectId'
                  params={{ subjectId: subject.id }}
                  className='underline underline-offset-2'
                >
                  {subject.name} ({subject.questionCount}){" "}
                </Link>
              ))}
            </p>
          ) : null}
          {thinArtists.length > 0 ? (
            <p className='mt-1 text-sm'>
              {thinArtists.length} artist(s) below{" "}
              {health.data?.minSongsPerArtist} songs:{" "}
              {thinArtists.slice(0, 5).map(artist => (
                <Link
                  key={artist.id}
                  to='/artists/$artistId'
                  params={{ artistId: artist.id }}
                  className='underline underline-offset-2'
                >
                  {artist.name} ({artist.songCount}){" "}
                </Link>
              ))}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className='grid gap-4 lg:grid-cols-3'>
        <Panel title='Live rooms' to='/rooms' linkLabel='All rooms'>
          {(rooms.data ?? []).length === 0 ? (
            <Empty>No rooms in progress.</Empty>
          ) : (
            (rooms.data ?? []).map(room => (
              <Row key={room.id}>
                <span className='flex min-w-0 items-center gap-2'>
                  <RoomStatusBadge status={room.status} />
                  <span className='truncate'>{room.name}</span>
                </span>
                <span className='shrink-0 text-xs text-muted-foreground'>
                  {room.hostName ?? "—"}
                </span>
              </Row>
            ))
          )}
        </Panel>

        <Panel title='Recent signups' to='/users' linkLabel='All users'>
          {(signups.data ?? []).length === 0 ? (
            <Empty>No users yet.</Empty>
          ) : (
            (signups.data ?? []).map(person => (
              <Row key={person.id}>
                <span className='min-w-0 truncate'>{person.name}</span>
                <span className='shrink-0 text-xs text-muted-foreground tabular-nums'>
                  {formatDate(person.createdAt)}
                </span>
              </Row>
            ))
          )}
        </Panel>

        <Panel title='Recent games' to='/history' linkLabel='All history'>
          {(games.data ?? []).length === 0 ? (
            <Empty>No games played yet.</Empty>
          ) : (
            (games.data ?? []).map(game => (
              <Row key={game.id}>
                <span className='flex min-w-0 items-center gap-2'>
                  <Badge tone='outline'>{game.gameType}</Badge>
                  <span className='truncate text-xs text-muted-foreground'>
                    {game.hostName ?? "—"}
                  </span>
                </span>
                <span className='shrink-0 text-xs text-muted-foreground'>
                  {formatRelative(game.createdAt)}
                </span>
              </Row>
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  to,
  linkLabel,
  children,
}: {
  title: string;
  to: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className='border'>
      <div className='flex items-center justify-between border-b bg-muted px-3 py-2'>
        <p className='text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase'>
          {title}
        </p>
        <Link
          to={to}
          className='text-[10px] tracking-widest text-muted-foreground uppercase hover:text-foreground'
        >
          {linkLabel}
        </Link>
      </div>
      <div className='divide-y'>{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex items-center justify-between gap-3 px-3 py-2 text-sm'>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className='px-3 py-4 text-sm text-muted-foreground'>{children}</p>;
}
