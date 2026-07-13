import { roomLimits } from "@zeyn/api/game-types";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router, type Href } from "expo-router";
import { Card, Chip, FieldError, Skeleton, Spinner, useToast } from "heroui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button } from "@/components/ui";
import { getErrorMessage } from "@/features/auth/lib/getErrorMessage";
import { GeneralConfigCard } from "@/features/games/components/GeneralConfigCard";
import { createBuzzerRoomSchema } from "@/features/games/lib/createRoomSchemas";
import { trpc } from "@/utils/trpc";

export function BuzzerCreateForm() {
  const { t } = useTranslation("game");
  const { toast } = useToast();
  const subjectsQuery = useQuery(trpc.buzzer.getSubjects.queryOptions());
  const createRoom = useMutation(trpc.game.createRoom.mutationOptions());

  const form = useForm({
    defaultValues: {
      name: "",
      maxPlayers: roomLimits.defaultMaxPlayers as number,
      isPublic: true,
      password: "",
      allowGuests: true,
      subjectIds: [] as string[],
    },
    validators: {
      onSubmit: createBuzzerRoomSchema(t),
    },
    onSubmit: async ({ value }) => {
      try {
        const { gameId } = await createRoom.mutateAsync({
          name: value.name.trim(),
          maxPlayers: value.maxPlayers,
          isPublic: value.isPublic,
          password: value.isPublic ? undefined : value.password || undefined,
          allowGuests: value.allowGuests,
          gameType: "buzzer",
          config: { subjectIds: value.subjectIds },
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

  const subjects = subjectsQuery.data ?? [];

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

            <form.Subscribe selector={(state) => state.values.subjectIds}>
              {(subjectIds) => (
                <Card>
                  <Card.Body className="gap-3">
                    <View className="flex-row items-center justify-between">
                      <Card.Title>{t("create.subject.selectSubjects")}</Card.Title>
                      <Chip size="sm" variant="soft">
                        <Chip.Label>
                          {t("create.subject.selected", {
                            count: subjectIds.length,
                            max: roomLimits.maxSubjects,
                          })}
                        </Chip.Label>
                      </Chip>
                    </View>
                    <Card.Description>
                      {t("create.subject.chooseRange", {
                        min: roomLimits.minSubjects,
                        max: roomLimits.maxSubjects,
                      })}
                    </Card.Description>

                    {subjectsQuery.isLoading ? (
                      <View className="flex-row flex-wrap gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Skeleton key={i} className="h-9 w-24 rounded-full" />
                        ))}
                      </View>
                    ) : (
                      <View className="flex-row flex-wrap gap-2">
                        {subjects.map((subject) => {
                          const selected = subjectIds.includes(subject.id);
                          return (
                            <Chip
                              key={subject.id}
                              variant={selected ? "primary" : "soft"}
                              onPress={() =>
                                form.setFieldValue(
                                  "subjectIds",
                                  selected
                                    ? subjectIds.filter((id) => id !== subject.id)
                                    : [...subjectIds, subject.id],
                                )
                              }
                            >
                              <Chip.Label>{subject.name}</Chip.Label>
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
