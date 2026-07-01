import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Users, Lock, Globe, Shield } from "lucide-react";
import { Input } from "@shaxsiy-oyin/ui/components/input";
import { Checkbox } from "@shaxsiy-oyin/ui/components/checkbox";
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
    <Card className='glass-card overflow-hidden'>
      <CardHeader className='bg-muted/30'>
        <CardTitle className='text-lg flex items-center gap-2'>
          <LayoutGrid className='size-5 text-primary' />
          General Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className='p-6 space-y-6'>
        <div className='space-y-2'>
          <Label htmlFor='room-name'>Room Name</Label>
          <Input
            id='room-name'
            placeholder='Enter a glorious name...'
            value={name}
            onChange={e => onNameChange(e.target.value)}
            className='text-lg h-12'
          />
          <p className='text-xs text-muted-foreground'>
            Minimum {roomLimits.nameMinLength} characters. Visible to players.
          </p>
        </div>

        <div className='grid gap-6 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              <Users className='size-4' /> Max Players
            </Label>
            <Input
              type='number'
              min={roomLimits.minPlayers}
              max={roomLimits.maxPlayers}
              value={maxPlayers}
              onChange={e => onMaxPlayersChange(parseInt(e.target.value))}
            />
          </div>
          <div className='space-y-4 pt-8'>
            <div className='flex items-center justify-between p-3 rounded-lg border bg-muted/20'>
              <div className='space-y-0.5'>
                <Label className='flex items-center gap-2'>
                  {isPublic ? (
                    <Globe className='size-4 text-primary' />
                  ) : (
                    <Lock className='size-4 text-destructive' />
                  )}
                  {isPublic ? "Public Lobby" : "Private Arena"}
                </Label>
                <p className='text-[10px] text-muted-foreground'>
                  {isPublic ? "Visible on dashboard" : "Invite only via link"}
                </p>
              </div>
              <Checkbox
                id='public-toggle'
                checked={isPublic}
                onCheckedChange={checked => onIsPublicChange(!!checked)}
              />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {!isPublic && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className='space-y-2 overflow-hidden'
            >
              <Label className='flex items-center gap-2'>
                <Shield className='size-4 text-primary' /> Room Password
                (Optional)
              </Label>
              <Input
                type='password'
                placeholder='Secure your borders...'
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
