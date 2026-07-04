import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@zeyn/ui/components/button";
import { Input } from "@zeyn/ui/components/input";
import { Label } from "@zeyn/ui/components/label";
import { Textarea } from "@zeyn/ui/components/textarea";
import { trpc } from "@/shared/lib/trpc";
import { toast } from "sonner";

const BIO_MAX = 280;

interface AccountSettingsProps {
  me: {
    name: string;
    username: string;
    bio: string | null;
  };
}

export function AccountSettings({ me }: AccountSettingsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState(me.name);
  const [username, setUsername] = useState(me.username);
  const [bio, setBio] = useState(me.bio ?? "");
  const [debouncedUsername, setDebouncedUsername] = useState(me.username);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUsername(username), 400);
    return () => clearTimeout(timer);
  }, [username]);

  const usernameChanged = debouncedUsername !== me.username;
  const checkQuery = useQuery({
    ...trpc.profile.checkUsername.queryOptions({ username: debouncedUsername }),
    enabled: usernameChanged && debouncedUsername.length > 0,
  });

  const updateMutation = useMutation(
    trpc.profile.updateProfile.mutationOptions({
      onSuccess: () => {
        toast.success(t("settings:account.updated"));
        queryClient.invalidateQueries({
          queryKey: trpc.profile.getMe.queryKey(),
        });
      },
      onError: error => toast.error(error.message),
    })
  );

  const usernameStatus = useMemo(() => {
    if (!usernameChanged) return null;
    if (username !== debouncedUsername || checkQuery.isFetching)
      return "checking" as const;
    if (checkQuery.data?.available) return "available" as const;
    return "unavailable" as const;
  }, [
    usernameChanged,
    username,
    debouncedUsername,
    checkQuery.isFetching,
    checkQuery.data,
  ]);

  const dirty =
    name.trim() !== me.name ||
    username !== me.username ||
    (bio ?? "") !== (me.bio ?? "");

  const canSave =
    dirty &&
    name.trim().length > 0 &&
    bio.length <= BIO_MAX &&
    !updateMutation.isPending &&
    (username === me.username || usernameStatus === "available");

  const handleSave = () => {
    updateMutation.mutate({
      name: name.trim(),
      ...(username !== me.username ? { username } : {}),
      bio,
    });
  };

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <Label htmlFor='name'>{t("settings:account.displayName")}</Label>
        <Input
          id='name'
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={60}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='username'>{t("settings:account.username")}</Label>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground'>@</span>
          <Input
            id='username'
            value={username}
            onChange={e =>
              setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))
            }
            maxLength={20}
            autoCapitalize='none'
            spellCheck={false}
          />
          {usernameStatus === "checking" && (
            <Loader2 className='size-4 shrink-0 animate-spin text-muted-foreground' />
          )}
          {usernameStatus === "available" && (
            <Check className='size-4 shrink-0 text-brand' />
          )}
          {usernameStatus === "unavailable" && (
            <X className='size-4 shrink-0 text-destructive' />
          )}
        </div>
        <p className='text-xs text-muted-foreground'>
          {usernameStatus === "unavailable"
            ? (checkQuery.data && "reason" in checkQuery.data
                ? checkQuery.data.reason
                : t("settings:account.usernameUnavailable"))
            : t("settings:account.usernameProfileUrl", {
                username: username || "…",
              })}
        </p>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='bio'>{t("settings:account.bio")}</Label>
        <Textarea
          id='bio'
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={4}
          placeholder={t("settings:account.bioPlaceholder")}
        />
        <p className='text-right text-xs text-muted-foreground'>
          {bio.length}/{BIO_MAX}
        </p>
      </div>

      <Button variant='brand' disabled={!canSave} onClick={handleSave}>
        {updateMutation.isPending
          ? t("settings:account.saving")
          : t("settings:account.save")}
      </Button>
    </div>
  );
}
