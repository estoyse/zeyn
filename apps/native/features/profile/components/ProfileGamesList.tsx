import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { Card } from "heroui-native";
import { Pressable, View } from "react-native";
import { withUniwind } from "uniwind";

import { Text } from "@/components/ui";
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
    <View className="gap-2">
      {items.map((item) => {
        const game = getClientGame(item.gameType);
        return (
          <Pressable
            key={item.historyId}
            onPress={() => router.push(`/game/${item.gameId}` as Href)}
          >
            <Card>
              <Card.Body className="flex-row items-center justify-between gap-3">
                <View className="flex-1 gap-0.5">
                  <Text weight="medium" numberOfLines={1}>
                    {item.roomName ?? game?.meta.title ?? item.gameType}
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
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
              </Card.Body>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}
