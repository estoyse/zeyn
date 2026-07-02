import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { roomLimits } from "@zeyn/api/game-types";
import { trpc } from "@/shared/lib/trpc";

export function useMusicCreateForm() {
  const navigate = useNavigate();
  const artistsQuery = useQuery(trpc.music.getArtists.queryOptions());
  const createRoom = useMutation(trpc.game.createRoom.mutationOptions());

  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState<number>(
    roomLimits.defaultMaxPlayers
  );
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState("");
  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);

  const toggleArtist = useCallback((id: string) => {
    setSelectedArtistIds(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  }, []);

  const hasName = name.trim().length >= roomLimits.nameMinLength;
  const hasArtists = selectedArtistIds.length >= 1;
  const canCreate = hasName && hasArtists;

  const create = useCallback(async () => {
    if (!canCreate) return;
    try {
      const { gameId } = await createRoom.mutateAsync({
        name,
        maxPlayers,
        isPublic,
        password: password || undefined,
        gameType: "music",
        config: { artistIds: selectedArtistIds },
      });
      navigate({ to: "/game/$gameId", params: { gameId } });
    } catch (e) {
      console.error("Failed to create room", e);
    }
  }, [
    canCreate,
    createRoom,
    name,
    maxPlayers,
    isPublic,
    password,
    selectedArtistIds,
    navigate,
  ]);

  return {
    artists: artistsQuery.data ?? [],
    artistsLoading: artistsQuery.isLoading,
    isCreating: createRoom.isPending,
    values: { name, maxPlayers, isPublic, password, selectedArtistIds },
    setName,
    setMaxPlayers,
    setIsPublic,
    setPassword,
    toggleArtist,
    checks: { hasName, hasArtists },
    canCreate,
    create,
  };
}
