import Ionicons from "@expo/vector-icons/Ionicons";
import { roomLimits } from "@zeyn/api/game-types";
import { Card, Label, Switch, TextField, Input } from "heroui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { Button, Text } from "@/components/ui";

const StyledIonicons = withUniwind(Ionicons);

interface GeneralConfigCardProps {
  name: string;
  onNameChange: (value: string) => void;
  maxPlayers: number;
  onMaxPlayersChange: (value: number) => void;
  isPublic: boolean;
  onIsPublicChange: (value: boolean) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  allowGuests: boolean;
  onAllowGuestsChange: (value: boolean) => void;
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
  allowGuests,
  onAllowGuestsChange,
}: GeneralConfigCardProps) {
  const { t } = useTranslation("game");

  return (
    <Card>
      <Card.Body className="gap-5">
        <Card.Title>{t("create.general.title")}</Card.Title>

        <TextField>
          <Label>{t("create.general.roomName")}</Label>
          <Input
            value={name}
            onChangeText={onNameChange}
            placeholder={t("create.general.roomNamePlaceholder")}
            autoCapitalize="sentences"
            maxLength={roomLimits.nameMaxLength}
          />
        </TextField>
        <Text className="text-muted-foreground -mt-3 text-xs">
          {t("create.general.roomNameHint", { count: roomLimits.nameMinLength })}
        </Text>

        <View className="gap-2">
          <Label>{t("create.general.maxPlayers")}</Label>
          <View className="flex-row items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              isIconOnly
              isDisabled={maxPlayers <= roomLimits.minPlayers}
              onPress={() => onMaxPlayersChange(Math.max(roomLimits.minPlayers, maxPlayers - 1))}
              accessibilityLabel={t("create.general.decreaseMaxPlayers")}
            >
              <StyledIonicons name="remove" size={16} className="text-foreground" />
            </Button>
            <Text weight="semibold" className="w-8 text-center text-lg">
              {maxPlayers}
            </Text>
            <Button
              variant="outline"
              size="sm"
              isIconOnly
              isDisabled={maxPlayers >= roomLimits.maxPlayers}
              onPress={() => onMaxPlayersChange(Math.min(roomLimits.maxPlayers, maxPlayers + 1))}
              accessibilityLabel={t("create.general.increaseMaxPlayers")}
            >
              <StyledIonicons name="add" size={16} className="text-foreground" />
            </Button>
          </View>
        </View>

        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Label>{t("create.general.visibility")}</Label>
            <Text className="text-muted-foreground text-xs">
              {isPublic
                ? t("create.general.visibilityPublicHint")
                : t("create.general.visibilityPrivateHint")}
            </Text>
          </View>
          <Switch isSelected={isPublic} onSelectedChange={onIsPublicChange} />
        </View>

        {!isPublic && (
          <TextField>
            <Label>{t("create.general.roomPassword")}</Label>
            <Input
              value={password}
              onChangeText={onPasswordChange}
              placeholder={t("create.general.roomPasswordPlaceholder")}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </TextField>
        )}

        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Label>{t("create.general.allowGuests")}</Label>
            <Text className="text-muted-foreground text-xs">
              {t("create.general.allowGuestsHint")}
            </Text>
          </View>
          <Switch isSelected={allowGuests} onSelectedChange={onAllowGuestsChange} />
        </View>
      </Card.Body>
    </Card>
  );
}
