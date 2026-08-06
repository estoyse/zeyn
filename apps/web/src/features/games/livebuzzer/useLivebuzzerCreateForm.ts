import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { roomLimits } from "@zeyn/api/game-types";
import { livebuzzerConfigSchema, type LivebuzzerConfig } from "@zeyn/api/games";
import { trpc } from "@/shared/lib/trpc";

export function useLivebuzzerCreateForm() {
  const navigate = useNavigate();
  const createRoom = useMutation(trpc.game.createRoom.mutationOptions());

  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState<number>(
    roomLimits.defaultMaxPlayers
  );
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState("");

  const [pointsPerCorrect, setPointsPerCorrect] = useState(10);
  const [penaltyPerWrong, setPenaltyPerWrong] = useState(0);
  const [maxWrongPerRound, setMaxWrongPerRound] = useState(3);
  const [hostPlays, setHostPlays] = useState(false);
  const [buzzWindowMs, setBuzzWindowMs] = useState(15000);
  const [answerTimeMs, setAnswerTimeMs] = useState(20000);

  const config: LivebuzzerConfig = useMemo(
    () => ({
      buzzWindowMs,
      answerTimeMs,
      pointsPerCorrect,
      penaltyPerWrong,
      maxWrongPerRound,
      hostPlays,
    }),
    [
      buzzWindowMs,
      answerTimeMs,
      pointsPerCorrect,
      penaltyPerWrong,
      maxWrongPerRound,
      hostPlays,
    ]
  );

  const hasName = name.trim().length >= roomLimits.nameMinLength;
  const hasValidConfig = livebuzzerConfigSchema.safeParse(config).success;
  const canCreate = hasName && hasValidConfig;

  const create = useCallback(async () => {
    if (!canCreate) return;
    try {
      const { gameId } = await createRoom.mutateAsync({
        name,
        maxPlayers,
        isPublic,
        password: password || undefined,
        gameType: "livebuzzer",
        config,
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
    config,
    navigate,
  ]);

  return {
    isCreating: createRoom.isPending,
    values: {
      name,
      maxPlayers,
      isPublic,
      password,
      pointsPerCorrect,
      penaltyPerWrong,
      maxWrongPerRound,
      hostPlays,
      buzzWindowMs,
      answerTimeMs,
    },
    setName,
    setMaxPlayers,
    setIsPublic,
    setPassword,
    setPointsPerCorrect,
    setPenaltyPerWrong,
    setMaxWrongPerRound,
    setHostPlays,
    setBuzzWindowMs,
    setAnswerTimeMs,
    checks: { hasName, hasValidConfig },
    canCreate,
    create,
  };
}
