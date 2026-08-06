import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@zeyn/ui/components/button";
import { ShieldAlert } from "lucide-react";

import { authClient } from "@/shared/lib/auth-client";
import { refreshSession, sessionQueryOptions } from "@/shared/lib/session";

export const Route = createFileRoute("/forbidden")({
  component: ForbiddenPage,
});

function ForbiddenPage() {
  const navigate = useNavigate();
  const { queryClient } = Route.useRouteContext();
  const { data: session } = useQuery(sessionQueryOptions);

  const signOut = async () => {
    await authClient.signOut();
    await refreshSession(queryClient);
    navigate({ to: "/login" });
  };

  return (
    <div className='flex min-h-svh items-center justify-center p-6'>
      <div className='w-full max-w-md border p-8'>
        <ShieldAlert className='size-6 text-destructive' />
        <h1 className='mt-4 text-2xl font-semibold tracking-tight'>
          Not authorized
        </h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          {session
            ? "This account does not have the admin role."
            : "You are not signed in."}
        </p>

        {session ? (
          <p className='mt-4 border-l-2 border-border pl-3 text-sm'>
            Signed in as{" "}
            <span className='font-medium'>{session.user.email}</span>
          </p>
        ) : null}

        <div className='mt-8 flex gap-2'>
          <Button variant='brand' onClick={signOut}>
            Sign out
          </Button>
          <Button
            variant='outline'
            render={<a href='https://zeyn.uz'>Back to zeyn.uz</a>}
          />
        </div>
      </div>
    </div>
  );
}
