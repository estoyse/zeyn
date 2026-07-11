import { canonicalizeGameId } from "@zeyn/api/game-code";
import { router, type Href } from "expo-router";
import { Card, Input, TextField } from "heroui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui";

export function JoinByIdCard() {
  const { t } = useTranslation("dashboard");
  const [gameToJoin, setGameToJoin] = useState("");

  function handleJoin() {
    const trimmed = gameToJoin.trim();
    if (!trimmed) return;
    router.push(`/game/${canonicalizeGameId(trimmed)}` as Href);
  }

  return (
    <Card>
      <Card.Body className="gap-3">
        <Card.Title>{t("joinById.title")}</Card.Title>
        <Card.Description>{t("joinById.description")}</Card.Description>
        <TextField>
          <Input
            value={gameToJoin}
            onChangeText={setGameToJoin}
            placeholder={t("joinById.placeholder")}
            autoCapitalize="characters"
            autoCorrect={false}
            spellCheck={false}
            returnKeyType="go"
            onSubmitEditing={handleJoin}
          />
        </TextField>
      </Card.Body>
      <Card.Footer>
        <Button className="w-full" isDisabled={!gameToJoin.trim()} onPress={handleJoin}>
          <Button.Label>{t("joinById.submit")}</Button.Label>
        </Button>
      </Card.Footer>
    </Card>
  );
}
