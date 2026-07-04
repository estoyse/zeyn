import { Link } from "@tanstack/react-router";
import {
  Gamepad2,
  History,
  Lock,
  Pencil,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@zeyn/ui/components/avatar";
import { Badge } from "@zeyn/ui/components/badge";
import { Button } from "@zeyn/ui/components/button";
import { initials, memberSince } from "../lib/format";
import { ProfileGamesList } from "./ProfileGamesList";

interface ProfileStats {
  gamesPlayed: number;
  bestScore: number;
  totalScore: number;
  gamesHosted: number;
}

interface ProfileGameItem {
  historyId: string;
  gameId: string;
  gameType: string;
  roomName: string | null;
  createdAt: Date | string | number;
  playerCount: number;
  score?: number;
}

export interface ProfileData {
  isOwner: boolean;
  user: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
    bio: string | null;
    createdAt: Date | string | number;
    isProfilePublic: boolean;
    showStats: boolean;
    showHistory: boolean;
    showHostedGames: boolean;
  };
  stats: ProfileStats | null;
  history: ProfileGameItem[] | null;
  hostedGames: ProfileGameItem[] | null;
}

function OwnerOnlyBadge() {
  const { t } = useTranslation();
  return (
    <Badge tone='outline' className='gap-1 text-muted-foreground'>
      <Lock className='size-3' />
      {t("profile:onlyYou")}
    </Badge>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Trophy;
}) {
  return (
    <div className='flex flex-col gap-1 border bg-card p-5'>
      <div className='flex items-center gap-2 text-muted-foreground'>
        <Icon className='size-4' />
        <span className='text-xs font-semibold tracking-wider uppercase'>
          {label}
        </span>
      </div>
      <span className='text-3xl font-bold tabular-nums'>{value}</span>
    </div>
  );
}

export function ProfileView({ data }: { data: ProfileData }) {
  const { t } = useTranslation();
  const { user, isOwner, stats, history, hostedGames } = data;

  return (
    <div className='mx-auto max-w-4xl space-y-12 px-4 py-10 md:py-14'>
      <header className='flex flex-col gap-6 sm:flex-row sm:items-start'>
        <Avatar className='size-24 border text-2xl'>
          {user.image ? (
            <AvatarImage src={user.image} alt={user.name} />
          ) : null}
          <AvatarFallback className='text-2xl font-bold'>
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>

        <div className='min-w-0 flex-1 space-y-3'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='space-y-1'>
              <h1 className='text-3xl font-bold'>{user.name}</h1>
              {user.username && (
                <p className='text-muted-foreground'>@{user.username}</p>
              )}
            </div>
            {isOwner && (
              <Link to='/settings'>
                <Button variant='outline' size='sm'>
                  <Pencil />
                  {t("profile:editProfile")}
                </Button>
              </Link>
            )}
          </div>

          {user.bio && (
            <p className='whitespace-pre-wrap text-sm leading-relaxed text-foreground/90'>
              {user.bio}
            </p>
          )}

          <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
            <Sparkles className='size-3.5' />
            <span>
              {t("profile:memberSince", { date: memberSince(user.createdAt) })}
            </span>
            {isOwner && !user.isProfilePublic && (
              <Badge tone='outline' className='gap-1'>
                <Lock className='size-3' />
                {t("profile:privateProfile")}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {stats && (
        <section className='space-y-4'>
          <div className='flex items-center gap-3'>
            <h2 className='text-lg font-bold'>{t("profile:stats.title")}</h2>
            {isOwner && !user.showStats && <OwnerOnlyBadge />}
          </div>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            <StatTile
              label={t("profile:stats.played")}
              value={stats.gamesPlayed}
              icon={Gamepad2}
            />
            <StatTile
              label={t("profile:stats.hosted")}
              value={stats.gamesHosted}
              icon={History}
            />
            <StatTile
              label={t("profile:stats.best")}
              value={stats.bestScore}
              icon={Trophy}
            />
            <StatTile
              label={t("profile:stats.total")}
              value={stats.totalScore}
              icon={Sparkles}
            />
          </div>
        </section>
      )}

      {history && (
        <section className='space-y-4'>
          <div className='flex items-center gap-3'>
            <h2 className='flex items-center gap-2 text-lg font-bold'>
              <History className='size-5' />
              {t("profile:recentGames.title")}
            </h2>
            {isOwner && !user.showHistory && <OwnerOnlyBadge />}
          </div>
          <ProfileGamesList
            items={history}
            emptyLabel={t("profile:recentGames.empty")}
          />
        </section>
      )}

      {hostedGames && (
        <section className='space-y-4'>
          <div className='flex items-center gap-3'>
            <h2 className='flex items-center gap-2 text-lg font-bold'>
              <Gamepad2 className='size-5' />
              {t("profile:hostedGames.title")}
            </h2>
            {isOwner && !user.showHostedGames && <OwnerOnlyBadge />}
          </div>
          <ProfileGamesList
            items={hostedGames}
            emptyLabel={t("profile:hostedGames.empty")}
          />
        </section>
      )}
    </div>
  );
}
