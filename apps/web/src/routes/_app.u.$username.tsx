import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { UserX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@zeyn/ui/components/button";
import { Skeleton } from "@zeyn/ui/components/skeleton";
import { ProfileView } from "@/features/profile/components/ProfileView";
import { trpc } from "@/shared/lib/trpc";

export const Route = createFileRoute("/_app/u/$username")({
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation();
  const { username } = Route.useParams();
  const profileQuery = useQuery(
    trpc.profile.getByUsername.queryOptions({ username })
  );

  return (
    <>
      {profileQuery.isLoading ? (
        <div className='mx-auto max-w-4xl space-y-8 px-4 py-14'>
          <div className='flex gap-6'>
            <Skeleton className='size-24 rounded-full' />
            <div className='flex-1 space-y-3'>
              <Skeleton className='h-8 w-48' />
              <Skeleton className='h-4 w-32' />
            </div>
          </div>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-24' />
            ))}
          </div>
        </div>
      ) : profileQuery.data ? (
        <ProfileView data={profileQuery.data} />
      ) : (
        <div className='mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center'>
          <UserX className='size-12 text-muted-foreground' />
          <h1 className='text-2xl font-bold'>{t("profile:notFound.title")}</h1>
          <p className='text-muted-foreground'>
            {t("profile:notFound.description", { username })}
          </p>
          <Link to='/'>
            <Button variant='outline'>{t("common:backHome")}</Button>
          </Link>
        </div>
      )}
    </>
  );
}
