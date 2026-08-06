import Ionicons from "@expo/vector-icons/Ionicons";
import { roomLimits } from "@zeyn/api/game-types";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { router, type Href } from "expo-router";
import { Card, Chip, FieldError, Label, Spinner, Switch, useToast } from "heroui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { Button, PressableScale, Text } from "@/components/ui";
import { getErrorMessage } from "@/features/auth/lib/getErrorMessage";
import { GeneralConfigCard } from "@/features/games/components/GeneralConfigCard";
import { createLivebuzzerRoomSchema } from "@/features/games/lib/createRoomSchemas";
import { encodeLocalSetup } from "@/features/local/local-config";
import { loadTcpSocketModule } from "@/features/local/transport";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

const StyledIonicons = withUniwind(Ionicons);

const CLOCK_CHOICES_MS = [0, 10000, 15000, 20000, 30000];

type RoomMode = "cloud" | "local";

function isLocalHostingAvailable(): boolean {
  try {
    loadTcpSocketModule();
    return true;
  } catch {
    return false;
  }
}

function ModeOption({
  icon,
  title,
  hint,
  selected,
  onPress,
}: {
  icon: "cloud-outline" | "wifi";
  title: string;
  hint: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      className={cn(
        "flex-1 gap-1.5 rounded-card border p-4",
        selected ? "border-brand bg-brand/10" : "border-border bg-muted-surface"
      )}
    >
      <StyledIonicons
        name={icon}
        size={20}
        className={selected ? "text-brand" : "text-muted-foreground"}
      />
      <Text weight="semibold" className="text-sm">
        {title}
      </Text>
      <Text className="text-muted-foreground text-xs">{hint}</Text>
    </PressableScale>
  );
}

function ClockChoiceRow({
  label,
  hint,
  value,
  onSelect,
}: {
  label: string;
  hint: string;
  value: number;
  onSelect: (value: number) => void;
}) {
  const { t: tGames } = useTranslation("games");

  return (
    <View className="gap-2">
      <View className="gap-0.5">
        <Label>{label}</Label>
        <Text className="text-muted-foreground text-xs">{hint}</Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {CLOCK_CHOICES_MS.map((ms) => (
          <Chip key={ms} variant={value === ms ? "primary" : "soft"} onPress={() => onSelect(ms)}>
            <Chip.Label>
              {ms === 0
                ? tGames("livebuzzer.create.clockOff")
                : tGames("livebuzzer.create.clockSeconds", { count: ms / 1000 })}
            </Chip.Label>
          </Chip>
        ))}
      </View>
    </View>
  );
}

function NumericStepperRow({
  label,
  value,
  onChange,
  step,
  min,
  max,
  decreaseLabel,
  increaseLabel,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step: number;
  min: number;
  max: number;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <View className="gap-2">
      <Label>{label}</Label>
      <View className="flex-row items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          isIconOnly
          isDisabled={value <= min}
          onPress={() => onChange(Math.max(min, value - step))}
          accessibilityLabel={decreaseLabel}
        >
          <StyledIonicons name="remove" size={16} className="text-foreground" />
        </Button>
        <Text weight="semibold" className="w-10 text-center text-lg">
          {value}
        </Text>
        <Button
          variant="outline"
          size="sm"
          isIconOnly
          isDisabled={value >= max}
          onPress={() => onChange(Math.min(max, value + step))}
          accessibilityLabel={increaseLabel}
        >
          <StyledIonicons name="add" size={16} className="text-foreground" />
        </Button>
      </View>
    </View>
  );
}

export function LivebuzzerCreateForm() {
  const { t } = useTranslation("game");
  const { t: tGames } = useTranslation("games");
  const { toast } = useToast();
  const createRoom = useMutation(trpc.game.createRoom.mutationOptions());
  const [localAvailable] = useState(isLocalHostingAvailable);
  const [mode, setMode] = useState<RoomMode>("cloud");

  const form = useForm({
    defaultValues: {
      name: "",
      maxPlayers: roomLimits.defaultMaxPlayers as number,
      isPublic: true,
      password: "",
      allowGuests: true,
      buzzWindowMs: 15000,
      answerTimeMs: 20000,
      pointsPerCorrect: 10,
      penaltyPerWrong: 0,
      maxWrongPerRound: 3,
      hostPlays: false,
    },
    validators: {
      onSubmit: createLivebuzzerRoomSchema(t),
    },
    onSubmit: async ({ value }) => {
      if (mode === "local" && localAvailable) {
        const setup = encodeLocalSetup({
          roomName: value.name.trim(),
          maxPlayers: value.maxPlayers,
          config: {
            buzzWindowMs: value.buzzWindowMs,
            answerTimeMs: value.answerTimeMs,
            pointsPerCorrect: value.pointsPerCorrect,
            penaltyPerWrong: value.penaltyPerWrong,
            maxWrongPerRound: value.maxWrongPerRound,
            hostPlays: value.hostPlays,
          },
        });
        router.replace(`/local/host?setup=${setup}` as Href);
        return;
      }

      try {
        const { gameId } = await createRoom.mutateAsync({
          name: value.name.trim(),
          maxPlayers: value.maxPlayers,
          isPublic: value.isPublic,
          password: value.isPublic ? undefined : value.password || undefined,
          allowGuests: value.allowGuests,
          gameType: "livebuzzer",
          config: {
            buzzWindowMs: value.buzzWindowMs,
            answerTimeMs: value.answerTimeMs,
            pointsPerCorrect: value.pointsPerCorrect,
            penaltyPerWrong: value.penaltyPerWrong,
            maxWrongPerRound: value.maxWrongPerRound,
            hostPlays: value.hostPlays,
          },
        });
        router.replace(`/game/${gameId}` as Href);
      } catch {
        toast.show({
          variant: "danger",
          label: t("create.errors.createFailed"),
        });
      }
    },
  });

  return (
    <View className="gap-5">
      <form.Subscribe
        selector={(state) => ({
          isSubmitting: state.isSubmitting,
          validationError: getErrorMessage(state.errorMap.onSubmit),
        })}
      >
        {({ isSubmitting, validationError }) => (
          <>
            <FieldError isInvalid={!!validationError}>{validationError}</FieldError>

            {localAvailable ? (
              <Card>
                <Card.Body className="gap-3">
                  <Card.Title>{tGames("livebuzzer.create.modeTitle")}</Card.Title>
                  <View className="flex-row gap-3">
                    <ModeOption
                      icon="cloud-outline"
                      title={tGames("livebuzzer.create.modeCloud")}
                      hint={tGames("livebuzzer.create.modeCloudHint")}
                      selected={mode === "cloud"}
                      onPress={() => setMode("cloud")}
                    />
                    <ModeOption
                      icon="wifi"
                      title={tGames("livebuzzer.create.modeLocal")}
                      hint={tGames("livebuzzer.create.modeLocalHint")}
                      selected={mode === "local"}
                      onPress={() => setMode("local")}
                    />
                  </View>
                  {mode === "local" ? (
                    <Text className="text-muted-foreground text-xs">
                      {tGames("livebuzzer.create.modeLocalNote")}
                    </Text>
                  ) : null}
                </Card.Body>
              </Card>
            ) : null}

            <form.Subscribe
              selector={(state) => ({
                name: state.values.name,
                maxPlayers: state.values.maxPlayers,
                isPublic: state.values.isPublic,
                password: state.values.password,
                allowGuests: state.values.allowGuests,
              })}
            >
              {(general) => (
                <GeneralConfigCard
                  name={general.name}
                  onNameChange={(value) => form.setFieldValue("name", value)}
                  maxPlayers={general.maxPlayers}
                  onMaxPlayersChange={(value) => form.setFieldValue("maxPlayers", value)}
                  isPublic={general.isPublic}
                  onIsPublicChange={(value) => form.setFieldValue("isPublic", value)}
                  password={general.password}
                  onPasswordChange={(value) => form.setFieldValue("password", value)}
                  allowGuests={general.allowGuests}
                  onAllowGuestsChange={(value) => form.setFieldValue("allowGuests", value)}
                />
              )}
            </form.Subscribe>

            <Card>
              <Card.Body className="gap-5">
                <Card.Title>{tGames("livebuzzer.create.rulesTitle")}</Card.Title>

                <form.Subscribe selector={(state) => state.values.buzzWindowMs}>
                  {(buzzWindowMs) => (
                    <ClockChoiceRow
                      label={tGames("livebuzzer.create.buzzWindow")}
                      hint={tGames("livebuzzer.create.buzzWindowHint")}
                      value={buzzWindowMs}
                      onSelect={(ms) => form.setFieldValue("buzzWindowMs", ms)}
                    />
                  )}
                </form.Subscribe>

                <form.Subscribe selector={(state) => state.values.answerTimeMs}>
                  {(answerTimeMs) => (
                    <ClockChoiceRow
                      label={tGames("livebuzzer.create.answerTime")}
                      hint={tGames("livebuzzer.create.answerTimeHint")}
                      value={answerTimeMs}
                      onSelect={(ms) => form.setFieldValue("answerTimeMs", ms)}
                    />
                  )}
                </form.Subscribe>

                <form.Subscribe selector={(state) => state.values.pointsPerCorrect}>
                  {(pointsPerCorrect) => (
                    <NumericStepperRow
                      label={tGames("livebuzzer.create.pointsPerCorrect")}
                      value={pointsPerCorrect}
                      onChange={(value) => form.setFieldValue("pointsPerCorrect", value)}
                      step={5}
                      min={5}
                      max={100}
                      decreaseLabel={tGames("livebuzzer.create.decreasePoints")}
                      increaseLabel={tGames("livebuzzer.create.increasePoints")}
                    />
                  )}
                </form.Subscribe>

                <form.Subscribe selector={(state) => state.values.penaltyPerWrong}>
                  {(penaltyPerWrong) => (
                    <NumericStepperRow
                      label={tGames("livebuzzer.create.penaltyPerWrong")}
                      value={penaltyPerWrong}
                      onChange={(value) => form.setFieldValue("penaltyPerWrong", value)}
                      step={5}
                      min={0}
                      max={100}
                      decreaseLabel={tGames("livebuzzer.create.decreasePenalty")}
                      increaseLabel={tGames("livebuzzer.create.increasePenalty")}
                    />
                  )}
                </form.Subscribe>

                <form.Subscribe selector={(state) => state.values.maxWrongPerRound}>
                  {(maxWrongPerRound) => (
                    <NumericStepperRow
                      label={tGames("livebuzzer.create.maxWrongPerRound")}
                      value={maxWrongPerRound}
                      onChange={(value) => form.setFieldValue("maxWrongPerRound", value)}
                      step={1}
                      min={1}
                      max={20}
                      decreaseLabel={tGames("livebuzzer.create.decreaseMaxWrong")}
                      increaseLabel={tGames("livebuzzer.create.increaseMaxWrong")}
                    />
                  )}
                </form.Subscribe>

                <form.Subscribe selector={(state) => state.values.hostPlays}>
                  {(hostPlays) => (
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="flex-1 gap-0.5">
                        <Label>{tGames("livebuzzer.create.hostPlays")}</Label>
                        <Text className="text-muted-foreground text-xs">
                          {tGames("livebuzzer.create.hostPlaysHint")}
                        </Text>
                      </View>
                      <Switch
                        isSelected={hostPlays}
                        onSelectedChange={(value) => form.setFieldValue("hostPlays", value)}
                      />
                    </View>
                  )}
                </form.Subscribe>
              </Card.Body>
            </Card>

            <Button onPress={form.handleSubmit} isDisabled={isSubmitting} size="lg">
              {isSubmitting ? (
                <Spinner size="sm" color="default" />
              ) : (
                <Button.Label>
                  {mode === "local"
                    ? tGames("livebuzzer.create.startLocal")
                    : t("create.deploy.createGame")}
                </Button.Label>
              )}
            </Button>
          </>
        )}
      </form.Subscribe>
    </View>
  );
}
