import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@zeyn/ui/components/button";
import { Input } from "@zeyn/ui/components/input";
import { Badge } from "@zeyn/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zeyn/ui/components/card";
import { toast } from "sonner";
import {
  Users,
  Play,
  Info,
  Crown,
  UserCircle2,
  Copy,
  Check,
  Lock,
  Globe,
  EyeOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatGameCode } from "@zeyn/api/game-code";
import type { ClientRoomState } from "@/features/game/hooks/useGameState";

interface GameLobbyProps {
  state: ClientRoomState;
  playerId: string;
  onStart: () => void;
  minPlayers: number;
  description: string;
}

export function GameLobby({
  state,
  playerId,
  onStart,
  minPlayers,
  description,
}: GameLobbyProps) {
  const { t } = useTranslation();
  const isHost = state.hostId === playerId;
  const [codeCopied, setCodeCopied] = useState(false);
  const codeCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (codeCopyTimeoutRef.current) {
        clearTimeout(codeCopyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(state.gameId ?? "");
    toast.success(t("game:lobby.codeCopied"));
    setCodeCopied(true);
    if (codeCopyTimeoutRef.current) {
      clearTimeout(codeCopyTimeoutRef.current);
    }
    codeCopyTimeoutRef.current = setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <motion.div
      key="lobby"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid gap-6 lg:grid-cols-[1fr_350px]"
    >
      <div className="space-y-6">
        {state.gameName && (
          <h2 className="text-2xl font-bold">{state.gameName}</h2>
        )}

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" />
                {t("game:lobby.playersInLobby")}
              </CardTitle>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {t("game:lobby.joined", { count: Object.keys(state.players).length, max: state.maxPlayers })}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.values(state.players).map((p) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={p.id}
                  className="flex items-center justify-between border bg-muted/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex size-8 items-center justify-center ${p.connected ? "bg-muted" : "bg-muted/50 opacity-50"}`}>
                      <UserCircle2 className={`size-4 ${p.connected ? "text-muted-foreground" : "text-muted-foreground/50"}`} />
                    </div>
                    <span className={`font-medium text-sm ${p.connected ? "" : "line-through"}`}>{p.name}</span>
                  </div>
                  {p.id === state.hostId && (
                    <Badge tone="brand">
                      <Crown className="size-2" />
                      {t("game:lobby.host")}
                    </Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center bg-brand/10 text-brand">
              <Info className="size-5" />
            </div>
            <div>
              <p className="font-medium text-sm">{t("game:lobby.gameInformation")}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card className="h-fit sticky top-4">
          <CardHeader>
            <CardTitle className="text-lg">{t("game:lobby.gameDetails")}</CardTitle>
            {state.hasPassword ? (
              <Badge tone="warning">
                <Lock className="size-3" />
                {t("game:lobby.locked")}
              </Badge>
            ) : state.isPublic ? (
              <Badge tone="success">
                <Globe className="size-3" />
                {t("game:lobby.public")}
              </Badge>
            ) : (
              <Badge tone="default">
                <EyeOff className="size-3" />
                {t("game:lobby.private")}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {state.gameId && (
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("game:lobby.joinCode")}</p>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  aria-label={t("game:lobby.copyCode")}
                  className="flex items-center gap-2 font-mono text-2xl font-bold tracking-widest select-all"
                >
                  {formatGameCode(state.gameId)}
                  {codeCopied ? <Check className="size-5" /> : <Copy className="size-5" />}
                </button>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground/70">{t("game:lobby.shareLink")}</p>
              <div className="flex gap-1">
                <Input
                  readOnly
                  value={window.location.href}
                  className="text-xs h-7 bg-muted/50 font-mono text-muted-foreground"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success(t("game:lobby.linkCopied"));
                  }}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            </div>

            {isHost ? (
              <Button
                variant="brand"
                className="w-full"
                onClick={onStart}
                disabled={Object.keys(state.players).length < minPlayers}
              >
                <Play className="size-4 mr-2" />
                {t("game:lobby.startGame")}
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-2 p-4 text-center bg-muted/50 border border-dashed">
                <div className="size-2 bg-brand rounded-full animate-ping" />
                <p className="text-xs text-muted-foreground">{t("game:lobby.waitingForHost")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </motion.div>
  );
}
