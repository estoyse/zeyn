import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { AdminShell } from "@/shared/components/AdminShell";
import { sessionQueryOptions } from "@/shared/lib/session";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData({
      ...sessionQueryOptions,
      revalidateIfStale: true,
    });

    if (!session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }

    if (session.user.role !== "admin") {
      throw redirect({ to: "/forbidden" });
    }

    return { session };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { session } = Route.useRouteContext();

  return (
    <AdminShell user={session.user}>
      <Outlet />
    </AdminShell>
  );
}
