import { roomLimits } from "@zeyn/api/game-types";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router, type Href } from "expo-router";
import { Card, Chip, FieldError, Skeleton, Spinner, useToast } from "heroui-native";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";

import { Button } from "@/components/ui";
import { getErrorMessage } from "@/features/auth/lib/getErrorMessage";
import { GeneralConfigCard } from "@/features/games/components/GeneralConfigCard";
import { createMusicRoomSchema } from "@/features/games/lib/createRoomSchemas";
import { trpc } from "@/utils/trpc";

const MIN_ARTISTS = 1;
const MAX_ARTISTS = 10;

export function MusicCreateForm() {
  const { t } = useTranslation("game");
  const { t: tGames } = useTranslation("games");
  const { toast } = useToast();
  const artistsQuery = useQuery(trpc.music.getArtists.queryOptions());
  const createRoom = useMutation(trpc.game.createRoom.mutationOptions());

  const form = useForm({
    defaultValues: {
      name: "",
      maxPlayers: roomLimits.defaultMaxPlayers as number,
      isPublic: true,
      password: "",
      allowGuests: true,
      artistIds: [] as string[],
    },
    validators: {
      onSubmit: createMusicRoomSchema(t),
    },
    onSubmit: async ({ value }) => {
      try {
        const { gameId } = await createRoom.mutateAsync({
          name: value.name.trim(),
          maxPlayers: value.maxPlayers,
          isPublic: value.isPublic,
          password: value.isPublic ? undefined : value.password || undefined,
          allowGuests: value.allowGuests,
          gameType: "music",
          config: { artistIds: value.artistIds },
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

  const artists = artistsQuery.data ?? [];

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

            <form.Subscribe selector={(state) => state.values.artistIds}>
              {(artistIds) => (
                <Card>
                  <Card.Body className="gap-3">
                    <View className="flex-row items-center justify-between">
                      <Card.Title>{tGames("music.artistPicker.title")}</Card.Title>
                      <Chip size="sm" variant="soft">
                        <Chip.Label>
                          {tGames("music.artistPicker.selectedCount", {
                            count: artistIds.length,
                          })}
                        </Chip.Label>
                      </Chip>
                    </View>
                    <Card.Description>
                      {tGames("music.artistPicker.chooseRange", {
                        min: MIN_ARTISTS,
                        max: MAX_ARTISTS,
                      })}
                    </Card.Description>

                    {artistsQuery.isLoading ? (
                      <View className="flex-row flex-wrap gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Skeleton key={i} className="h-9 w-24 rounded-full" />
                        ))}
                      </View>
                    ) : artists.length === 0 ? (
                      <Card.Description>{tGames("music.artistPicker.empty")}</Card.Description>
                    ) : (
                      <View className="flex-row flex-wrap gap-2">
                        {artists.map((artist) => {
                          const selected = artistIds.includes(artist.id);
                          return (
                            <Chip
                              key={artist.id}
                              variant={selected ? "primary" : "soft"}
                              onPress={() =>
                                form.setFieldValue(
                                  "artistIds",
                                  selected
                                    ? artistIds.filter((id) => id !== artist.id)
                                    : [...artistIds, artist.id],
                                )
                              }
                            >
                              {artist.artworkUrl && (
                                <Image
                                  source={{ uri: artist.artworkUrl }}
                                  className="mr-1.5 size-5 rounded-full"
                                />
                              )}
                              <Chip.Label>{artist.name}</Chip.Label>
                            </Chip>
                          );
                        })}
                      </View>
                    )}
                  </Card.Body>
                </Card>
              )}
            </form.Subscribe>

            <Button onPress={form.handleSubmit} isDisabled={isSubmitting} size="lg">
              {isSubmitting ? (
                <Spinner size="sm" color="default" />
              ) : (
                <Button.Label>{t("create.deploy.createGame")}</Button.Label>
              )}
            </Button>
          </>
        )}
      </form.Subscribe>
    </View>
  );
}
