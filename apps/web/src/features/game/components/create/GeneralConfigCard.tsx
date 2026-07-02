import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Users, Lock, Globe, Shield, Minus, Plus } from "lucide-react";
import { Input } from "@shaxsiy-oyin/ui/components/input";
import { Label } from "@shaxsiy-oyin/ui/components/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";
import { roomLimits } from "@shaxsiy-oyin/api/game-types";

interface GeneralConfigCardProps {
  name: string;
  onNameChange: (value: string) => void;
  maxPlayers: number;
  onMaxPlayersChange: (value: number) => void;
  isPublic: boolean;
  onIsPublicChange: (value: boolean) => void;
  password: string;
  onPasswordChange: (value: string) => void;
}

const metaLabel = "text-xs uppercase tracking-widest text-muted-foreground";

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex w-fit items-stretch border">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease max players"
        className="grid size-11 place-content-center border-r text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <div className="grid w-20 place-content-center font-heading text-lg tabular-nums">
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase max players"
        className="grid size-11 place-content-center border-l text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function VisibilityToggle({
  isPublic,
  onChange,
}: {
  isPublic: boolean;
  onChange: (value: boolean) => void;
}) {
  const base =
    "flex items-center justify-center gap-2 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors";
  const active = "bg-brand text-brand-foreground";
  const idle = "text-muted-foreground hover:bg-muted hover:text-foreground";

  return (
    <div className="grid grid-cols-2 border">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`${base} ${isPublic ? active : idle}`}
      >
        <Globe className="size-4" /> Public
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`${base} border-l ${!isPublic ? active : idle}`}
      >
        <Lock className="size-4" /> Private
      </button>
    </div>
  );
}

export function GeneralConfigCard({
  name,
  onNameChange,
  maxPlayers,
  onMaxPlayersChange,
  isPublic,
  onIsPublicChange,
  password,
  onPasswordChange,
}: GeneralConfigCardProps) {
  return (
    <Card>
      <CardHeader className="bg-muted/50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <LayoutGrid className="size-5 text-brand" />
          General Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-2">
          <Label htmlFor="room-name" className={metaLabel}>
            Room Name
          </Label>
          <Input
            id="room-name"
            placeholder="Enter a glorious name..."
            value={name}
            onChange={e => onNameChange(e.target.value)}
            className="h-12 text-lg"
          />
          <p className="text-xs text-muted-foreground">
            Minimum {roomLimits.nameMinLength} characters. Visible to players.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className={`flex items-center gap-2 ${metaLabel}`}>
              <Users className="size-3.5" /> Max Players
            </Label>
            <Stepper
              value={maxPlayers}
              min={roomLimits.minPlayers}
              max={roomLimits.maxPlayers}
              onChange={onMaxPlayersChange}
            />
          </div>

          <div className="space-y-2">
            <Label className={metaLabel}>Visibility</Label>
            <VisibilityToggle isPublic={isPublic} onChange={onIsPublicChange} />
            <p className="text-[11px] text-muted-foreground">
              {isPublic
                ? "Visible on the public dashboard."
                : "Invite-only via direct link."}
            </p>
          </div>
        </div>

        <AnimatePresence>
          {!isPublic && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <Label className={`flex items-center gap-2 ${metaLabel}`}>
                <Shield className="size-3.5 text-brand" /> Room Password
                (Optional)
              </Label>
              <Input
                type="password"
                placeholder="Secure your borders..."
                value={password}
                onChange={e => onPasswordChange(e.target.value)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
