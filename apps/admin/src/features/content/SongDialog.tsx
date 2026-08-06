import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";

import { TextField } from "@/shared/components/FormField";
import { ResourceDialog } from "@/shared/components/ResourceDialog";
import { songFormSchema } from "@/features/content/lib/schemas";
import { trpc } from "@/shared/lib/trpc";
import { useAdminMutation } from "@/shared/lib/useAdminMutation";

export interface SongSummary {
  id: string;
  title: string;
  previewUrl: string;
  artworkUrl: string | null;
}

interface SongDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistId: string;
  song: SongSummary | null;
}

export function SongDialog({
  open,
  onOpenChange,
  artistId,
  song,
}: SongDialogProps) {
  const isEdit = song !== null;

  const invalidate = [
    trpc.admin.music.getArtist.queryKey({ id: artistId }),
    trpc.admin.music.listArtists.queryKey(),
  ];

  const createMutation = useAdminMutation(
    trpc.admin.music.createSong.mutationOptions(),
    {
      successMessage: "Song added",
      invalidate,
      onDone: () => onOpenChange(false),
    }
  );

  const updateMutation = useAdminMutation(
    trpc.admin.music.updateSong.mutationOptions(),
    {
      successMessage: "Song updated",
      invalidate,
      onDone: () => onOpenChange(false),
    }
  );

  const form = useForm({
    defaultValues: {
      title: song?.title ?? "",
      previewUrl: song?.previewUrl ?? "",
      artworkUrl: song?.artworkUrl ?? "",
    },
    validators: { onSubmit: songFormSchema },
    onSubmit: ({ value }) => {
      if (song) {
        updateMutation.mutate({ id: song.id, ...value });
      } else {
        createMutation.mutate({ artistId, ...value });
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: song?.title ?? "",
        previewUrl: song?.previewUrl ?? "",
        artworkUrl: song?.artworkUrl ?? "",
      });
    }
  }, [open, song, form]);

  return (
    <ResourceDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit song" : "New song"}
      description='The preview URL must point at a playable audio clip; rooms cannot use a song without one.'
      submitLabel={isEdit ? "Save" : "Add"}
      isPending={createMutation.isPending || updateMutation.isPending}
      onSubmit={() => form.handleSubmit()}
    >
      <form.Field name='title'>
        {field => <TextField field={field} label='Title' />}
      </form.Field>
      <form.Field name='previewUrl'>
        {field => (
          <TextField
            field={field}
            label='Preview URL'
            placeholder='https://…/preview.m4a'
          />
        )}
      </form.Field>
      <form.Field name='artworkUrl'>
        {field => (
          <TextField
            field={field}
            label='Artwork URL'
            placeholder='https://… (optional)'
          />
        )}
      </form.Field>
    </ResourceDialog>
  );
}
