import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { roomLimits } from "@zeyn/api/game-types";
import { trpc } from "@/shared/lib/trpc";

// Owns all state, derived validity and the create mutation for the create-game
// page, so the route/components are purely presentational.
export function useCreateGameForm() {
  const navigate = useNavigate();
  const subjectsQuery = useQuery(trpc.buzzer.getSubjects.queryOptions());
  const createRoom = useMutation(trpc.game.createRoom.mutationOptions());

  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState<number>(
    roomLimits.defaultMaxPlayers
  );
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const toggleSubject = useCallback((id: string) => {
    setSelectedSubjectIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }, []);

  const hasName = name.trim().length >= roomLimits.nameMinLength;
  const hasEnoughSubjects =
    selectedSubjectIds.length >= roomLimits.minSubjects &&
    selectedSubjectIds.length <= roomLimits.maxSubjects;
  const canCreate = hasName && hasEnoughSubjects;

  const create = useCallback(async () => {
    if (!canCreate) return;
    try {
      const { gameId } = await createRoom.mutateAsync({
        name,
        maxPlayers,
        isPublic,
        password: password || undefined,
        gameType: "buzzer",
        config: { subjectIds: selectedSubjectIds },
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
    selectedSubjectIds,
    navigate,
  ]);

  return {
    subjects: subjectsQuery.data ?? [],
    subjectsLoading: subjectsQuery.isLoading,
    isCreating: createRoom.isPending,
    values: { name, maxPlayers, isPublic, password, selectedSubjectIds },
    setName,
    setMaxPlayers,
    setIsPublic,
    setPassword,
    toggleSubject,
    checks: { hasName, hasEnoughSubjects },
    canCreate,
    create,
  };
}
