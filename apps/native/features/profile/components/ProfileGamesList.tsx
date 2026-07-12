import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { Card } from "heroui-native";
import { Fragment } from "react";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { Group, Row, RowSeparator, Text } from "@/components/ui";
import { getClientGame } from "@/features/games/registry";

const StyledIonicons = withUniwind(Ionicons);

export interface ProfileGameItem {
  historyId: string;
  gameId: string;
  gameType: string;
  roomName: string | null;
  createdAt: Date | string | number;
  playerCount: number;
  score?: number;
}

interface ProfileGamesListProps {
  items: ProfileGameItem[];
  emptyLabel: string;
}

export function ProfileGamesList({ items, emptyLabel }: ProfileGamesListProps) {
  if (items.length === 0) {
    return (
      <Card>
        <Card.Body>
          <Card.Description>{emptyLabel}</Card.Description>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Group>
      {items.map((item, index) => {
        const game = getClientGame(item.gameType);
        return (
          <Fragment key={item.historyId}>
            <Row
              label={item.roomName ?? game?.meta.title ?? item.gameType}
              caption={new Date(item.createdAt).toLocaleDateString()}
              leading={
                <StyledIonicons
                  name="game-controller"
                  size={18}
                  className="text-muted-foreground"
                />
              }
              trailing={
                <View className="items-end gap-0.5">
                  <View className="flex-row items-center gap-1">
                    <StyledIonicons name="people" size={12} className="text-muted-foreground" />
                    <Text className="text-muted-foreground text-xs">{item.playerCount}</Text>
                  </View>
                  {typeof item.score === "number" ? (
                    <View className="flex-row items-center gap-1">
                      <StyledIonicons name="trophy" size={12} className="text-brand" />
                      <Text weight="semibold" className="text-brand text-xs">
                        {item.score}
                      </Text>
                    </View>
                  ) : null}
                </View>
              }
              chevron
              onPress={() => router.push(`/game/${item.gameId}` as Href)}
            />
            {index < items.length - 1 ? <RowSeparator /> : null}
          </Fragment>
        );
      })}
    </Group>
  );
}
