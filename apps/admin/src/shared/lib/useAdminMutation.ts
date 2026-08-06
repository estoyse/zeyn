import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryKey, UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";

interface AdminMutationExtras<TData> {
  successMessage: string | ((data: TData) => string);
  invalidate?: QueryKey[];
  onDone?: (data: TData) => void;
}

export function useAdminMutation<TData, TError, TVariables, TContext>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
  { successMessage, invalidate = [], onDone }: AdminMutationExtras<TData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    onSuccess: async (data: TData) => {
      const message =
        typeof successMessage === "function"
          ? successMessage(data)
          : successMessage;
      toast.success(message);

      const warning = (data as { warning?: string | null } | null)?.warning;
      if (warning) {
        toast.warning(warning);
      }

      await Promise.all(
        invalidate.map(queryKey => queryClient.invalidateQueries({ queryKey }))
      );
      onDone?.(data);
    },
    onError: (error: TError) => {
      const message = (error as { message?: string } | null)?.message;
      toast.error(message ?? "Something went wrong");
    },
  });
}
