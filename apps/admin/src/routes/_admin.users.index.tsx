import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@zeyn/ui/components/avatar";
import { Badge } from "@zeyn/ui/components/badge";
import { Button } from "@zeyn/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@zeyn/ui/components/dropdown-menu";
import { Input } from "@zeyn/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zeyn/ui/components/select";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import z from "zod";

import { DataTable, type Column } from "@/shared/components/DataTable";
import type { UserListItem } from "@/shared/lib/api-types";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageHeader } from "@/shared/components/PageHeader";
import { TablePager } from "@/shared/components/TablePager";
import { BanDialog, type BanTarget } from "@/features/users/BanDialog";
import { formatDate } from "@/shared/lib/format";
import { trpc } from "@/shared/lib/trpc";
import { useAdminMutation } from "@/shared/lib/useAdminMutation";

const PAGE_SIZE = 25;

const searchSchema = z.object({
  q: z.string().optional(),
  role: z.enum(["user", "admin"]).optional(),
  status: z.enum(["active", "banned"]).optional(),
  offset: z.number().int().min(0).optional(),
});

export const Route = createFileRoute("/_admin/users/")({
  validateSearch: searchSchema,
  component: UsersPage,
});

function UsersPage() {
  const { q, role, status, offset = 0 } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { session } = Route.useRouteContext();

  const [banning, setBanning] = useState<BanTarget | null>(null);

  const listQuery = useQuery(
    trpc.admin.users.list.queryOptions({
      search: q,
      role,
      banned: status === undefined ? undefined : status === "banned",
      limit: PAGE_SIZE,
      offset,
      sort: "createdAt",
    })
  );

  const invalidate = [trpc.admin.users.list.queryKey()];

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

  const columns: Column<UserListItem>[] = [
    {
      id: "user",
      header: "User",
      cell: row => (
        <div className='flex items-center gap-3'>
          <Avatar className='size-8'>
            {row.image ? <AvatarImage src={row.image} alt='' /> : null}
            <AvatarFallback>
              {row.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <p className='truncate font-medium'>{row.name}</p>
            <p className='truncate text-xs text-muted-foreground'>
              {row.username ? `@${row.username}` : row.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "email",
      header: "Email",
      className: "w-72",
      cell: row => (
        <div className='flex items-center gap-2'>
          <span className='truncate text-muted-foreground'>{row.email}</span>
          {row.emailVerified ? <Badge tone='success'>Verified</Badge> : null}
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      className: "w-28",
      cell: row => (
        <Badge tone={row.role === "admin" ? "brand" : "default"}>
          {row.role}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      className: "w-32",
      cell: row =>
        row.banned ? (
          <Badge tone='destructive'>Banned</Badge>
        ) : (
          <Badge tone='outline'>Active</Badge>
        ),
    },
    {
      id: "joined",
      header: "Joined",
      className: "w-32",
      cell: row => (
        <span className='text-muted-foreground tabular-nums'>
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      className: "w-12",
      cell: row => {
        const isSelf = row.id === session.user.id;
        return (
          <div data-row-action>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant='ghost' size='icon-xs' />}
              >
                <MoreHorizontal />
                <span className='sr-only'>Actions</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={() =>
                    navigate({
                      to: "/users/$userId",
                      params: { userId: row.id },
                    })
                  }
                >
                  View
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={isSelf}
                  onClick={() =>
                    setRoleMutation.mutate({
                      userId: row.id,
                      role: row.role === "admin" ? "user" : "admin",
                    })
                  }
                >
                  {row.role === "admin" ? "Revoke admin" : "Make admin"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => revokeMutation.mutate({ userId: row.id })}
                >
                  Force sign-out
                </DropdownMenuItem>
                {row.banned ? (
                  <DropdownMenuItem
                    onClick={() => unbanMutation.mutate({ userId: row.id })}
                  >
                    Unban
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    variant='destructive'
                    disabled={isSelf}
                    onClick={() =>
                      setBanning({
                        id: row.id,
                        name: row.name,
                        email: row.email,
                      })
                    }
                  >
                    Ban
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className='space-y-6'>
      <PageHeader
        eyebrow='People'
        title='Users'
        description='Accounts, roles and moderation.'
      />

      <div className='flex flex-wrap items-center gap-2'>
        <Input
          placeholder='Search name, email or username'
          className='max-w-xs'
          defaultValue={q ?? ""}
          onChange={event => {
            const value = event.target.value.trim();
            navigate({
              search: prev => ({
                ...prev,
                q: value || undefined,
                offset: undefined,
              }),
              replace: true,
            });
          }}
        />
        <Select
          value={role ?? "all"}
          onValueChange={value =>
            navigate({
              search: prev => ({
                ...prev,
                role: value === "all" ? undefined : (value as "user" | "admin"),
                offset: undefined,
              }),
            })
          }
        >
          <SelectTrigger className='w-40'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All roles</SelectItem>
            <SelectItem value='admin'>Admins</SelectItem>
            <SelectItem value='user'>Users</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={status ?? "all"}
          onValueChange={value =>
            navigate({
              search: prev => ({
                ...prev,
                status:
                  value === "all"
                    ? undefined
                    : (value as "active" | "banned"),
                offset: undefined,
              }),
            })
          }
        >
          <SelectTrigger className='w-40'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All statuses</SelectItem>
            <SelectItem value='active'>Active</SelectItem>
            <SelectItem value='banned'>Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <DataTable
          columns={columns}
          rows={listQuery.data?.items}
          isLoading={listQuery.isLoading}
          rowKey={row => row.id}
          onRowClick={row =>
            navigate({ to: "/users/$userId", params: { userId: row.id } })
          }
          empty={<EmptyState title='No matching users' />}
        />
        {listQuery.data ? (
          <TablePager
            total={listQuery.data.total}
            limit={listQuery.data.limit}
            offset={listQuery.data.offset}
            onOffsetChange={next =>
              navigate({
                search: prev => ({ ...prev, offset: next || undefined }),
              })
            }
          />
        ) : null}
      </div>

      <BanDialog
        open={banning !== null}
        target={banning}
        onOpenChange={open => {
          if (!open) setBanning(null);
        }}
      />
    </div>
  );
}
