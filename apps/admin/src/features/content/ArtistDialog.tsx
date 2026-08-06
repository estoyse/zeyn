import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";

import { TextField } from "@/shared/components/FormField";
import { ResourceDialog } from "@/shared/components/ResourceDialog";
import { artistFormSchema } from "@/features/content/lib/schemas";
import { trpc } from "@/shared/lib/trpc";
import { useAdminMutation } from "@/shared/lib/useAdminMutation";

export interface ArtistSummary {
  id: string;
  name: string;
  artworkUrl: string | null;
}

interface ArtistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artist: ArtistSummary | null;
}

export function ArtistDialog({
  open,
  onOpenChange,
  artist,
}: ArtistDialogProps) {
  const isEdit = artist !== null;

  const invalidate = [
    trpc.admin.music.listArtists.queryKey(),
    ...(artist ? [trpc.admin.music.getArtist.queryKey({ id: artist.id })] : []),
  ];

  const createMutation = useAdminMutation(
    trpc.admin.music.createArtist.mutationOptions(),
    {
      successMessage: "Artist created",
      invalidate,
      onDone: () => onOpenChange(false),
    }
  );

  const updateMutation = useAdminMutation(
    trpc.admin.music.updateArtist.mutationOptions(),
    {
      successMessage: "Artist updated",
      invalidate,
      onDone: () => onOpenChange(false),
    }
  );

  const form = useForm({
    defaultValues: {
      name: artist?.name ?? "",
      artworkUrl: artist?.artworkUrl ?? "",
    },
    validators: { onSubmit: artistFormSchema },
    onSubmit: ({ value }) => {
      if (artist) {
        updateMutation.mutate({ id: artist.id, ...value });
      } else {
        createMutation.mutate(value);
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: artist?.name ?? "",
        artworkUrl: artist?.artworkUrl ?? "",
      });
    }
  }, [open, artist, form]);

  return (
    <ResourceDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit artist" : "New artist"}
      submitLabel={isEdit ? "Save" : "Create"}
      isPending={createMutation.isPending || updateMutation.isPending}
      onSubmit={() => form.handleSubmit()}
    >
      <form.Field name='name'>
        {field => (
          <TextField field={field} label='Name' placeholder='e.g. Sevara' />
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
