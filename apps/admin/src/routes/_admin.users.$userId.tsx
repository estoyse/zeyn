import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@zeyn/ui/components/avatar";
import { Badge } from "@zeyn/ui/components/badge";
import { Button } from "@zeyn/ui/components/button";
import { Input } from "@zeyn/ui/components/input";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { ConfirmDelete } from "@/shared/components/ConfirmDelete";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatCard } from "@/shared/components/StatCard";
import { BanDialog } from "@/features/users/BanDialog";
import { formatDate, formatDateTime } from "@/shared/lib/format";
import { trpc } from "@/shared/lib/trpc";
import { useAdminMutation } from "@/shared/lib/useAdminMutation";

export const Route = createFileRoute("/_admin/users/$userId")({
  component: UserDetailPage,
});

function UserDetailPage() {
  const { userId } = Route.useParams();
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();

  const [banning, setBanning] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");

  const detailQuery = useQuery(
    trpc.admin.users.get.queryOptions({ id: userId })
  );

  const invalidate = [
    trpc.admin.users.get.queryKey({ id: userId }),
    trpc.admin.users.list.queryKey(),
  ];

  const setRoleMutation = useAdminMutation(
    trpc.admin.users.setRole.mutationOptions(),
    { successMessage: "Role updated", invalidate }
  );
  const unbanMutation = useAdminMutation(
    trpc.admin.users.unban.mutationOptions(),
    { successMessage: "User unbanned", invalidate }
  );
  const revokeMutation = useAdminMutation(
    trpc.admin.users.revokeSessions.mutationOptions(),
    {
      successMessage: data => `${data.revokedSessions} session(s) revoked`,
      invalidate,
    }
  );
  const removeMutation = useAdminMutation(
    trpc.admin.users.remove.mutationOptions(),
    {
      successMessage: data =>
        data.destroyedHistories > 0
          ? `Account deleted along with ${data.destroyedHistories} hosted game(s)`
          : "Account deleted",
      invalidate: [trpc.admin.users.list.queryKey()],
      onDone: () => navigate({ to: "/users" }),
    }
  );

  const detail = detailQuery.data;
  const target = detail?.user;
  const isSelf = userId === session.user.id;

  return (
    <div className='space-y-6'>
      <Link
        to='/users'
        className='inline-flex items-center gap-1.5 text-xs tracking-widest text-muted-foreground uppercase hover:text-foreground'
      >
        <ArrowLeft className='size-3.5' />
        Users
      </Link>

      <PageHeader eyebrow='User' title={target?.name ?? "…"}>
        {target ? (
          <>
            <Button
              variant='outline'
              disabled={isSelf || setRoleMutation.isPending}
              onClick={() =>
                setRoleMutation.mutate({
                  userId,
                  role: target.role === "admin" ? "user" : "admin",
                })
              }
            >
              {target.role === "admin" ? "Revoke admin" : "Make admin"}
            </Button>
            <Button
              variant='outline'
              onClick={() => revokeMutation.mutate({ userId })}
            >
              Force sign-out
            </Button>
            {target.banned ? (
              <Button
                variant='outline'
                onClick={() => unbanMutation.mutate({ userId })}
              >
                Unban
              </Button>
            ) : (
              <Button
                variant='destructive'
                disabled={isSelf}
                onClick={() => setBanning(true)}
              >
                Ban
              </Button>
            )}
          </>
        ) : null}
      </PageHeader>

      {target ? (
        <>
          <div className='flex items-center gap-4 border p-4'>
            <Avatar className='size-12'>
              {target.image ? <AvatarImage src={target.image} alt='' /> : null}
              <AvatarFallback>
                {target.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0 flex-1'>
              <p className='font-medium'>{target.email}</p>
              <p className='text-sm text-muted-foreground'>
                {target.username ? `@${target.username}` : "no username"} ·{" "}
                {target.locale} · joined {formatDate(target.createdAt)}
              </p>
            </div>
            <div className='flex gap-2'>
              <Badge tone={target.role === "admin" ? "brand" : "default"}>
                {target.role}
              </Badge>
              <Badge tone={target.banned ? "destructive" : "outline"}>
                {target.banned ? "Banned" : "Active"}
              </Badge>
            </div>
          </div>

          {target.banned ? (
            <p className='border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
              Banned{target.banReason ? `: ${target.banReason}` : ""}.{" "}
              {target.banExpires
                ? `Expires ${formatDateTime(target.banExpires)}.`
                : "This ban is permanent."}
            </p>
          ) : null}

          <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
            <StatCard label='Active sessions' value={detail.activeSessions} />
            <StatCard label='Games hosted' value={detail.hostedGames} />
            <StatCard label='Games played' value={detail.playedGames} />
            <StatCard
              label='Profile'
              value={target.isProfilePublic ? "Public" : "Private"}
            />
          </div>

          <div className='border'>
            <p className='border-b bg-muted px-3 py-2 text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase'>
              Recent games
            </p>
            {detail.recentGames.length === 0 ? (
              <p className='p-4 text-sm text-muted-foreground'>
                No games played yet.
              </p>
            ) : (
              <ul className='divide-y'>
                {detail.recentGames.map(game => (
                  <li
                    key={game.historyId}
                    className='flex items-center justify-between px-3 py-2 text-sm'
                  >
                    <span className='flex items-center gap-2'>
                      <Badge tone='outline'>{game.gameType}</Badge>
                      <span className='text-muted-foreground tabular-nums'>
                        {formatDateTime(game.createdAt)}
                      </span>
                    </span>
                    <span className='tabular-nums'>{game.score} pts</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className='border border-destructive/40 p-4'>
            <p className='text-[10px] font-black tracking-[0.3em] text-destructive uppercase'>
              Danger zone
            </p>
            <p className='mt-2 text-sm text-muted-foreground'>
              Deleting this account also destroys every game it hosted,
              including other players' scoreboards for those games. Prefer a
              ban.
            </p>
            <Button
              variant='destructive'
              className='mt-3'
              disabled={isSelf}
              onClick={() => {
                setConfirmEmail("");
                setRemoving(true);
              }}
            >
              Delete account
            </Button>
          </div>
        </>
      ) : null}

      <BanDialog
        open={banning}
        target={
          target
            ? { id: target.id, name: target.name, email: target.email }
            : null
        }
        onOpenChange={setBanning}
      />

      <ConfirmDelete
        open={removing}
        onOpenChange={setRemoving}
        title='Delete this account?'
        description={`Type ${target?.email ?? ""} below to confirm. This cannot be undone.`}
        confirmLabel='Delete account'
        isPending={removeMutation.isPending}
        onConfirm={() =>
          removeMutation.mutate({ userId, confirmEmail })
        }
      >
        <Input
          placeholder={target?.email ?? "email"}
          value={confirmEmail}
          onChange={event => setConfirmEmail(event.target.value)}
        />
      </ConfirmDelete>
    </div>
  );
}
