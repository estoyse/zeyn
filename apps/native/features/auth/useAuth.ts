import { router, type Href } from "expo-router";
import { useToast } from "heroui-native";
import { useTranslation } from "react-i18next";

import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

type AuthApiError = { message?: string; statusText?: string } | null | undefined;

function resolveErrorMessage(error: AuthApiError, fallback: string): string {
  return error?.message || error?.statusText || fallback;
}

export function useAuth() {
  const { toast } = useToast();
  const { t } = useTranslation("auth");
  const { data: session, isPending, error: sessionError } = authClient.useSession();

  function handleSuccess(successMessage: string, returnTo?: string) {
    queryClient.refetchQueries();
    toast.show({ variant: "success", label: successMessage });
    router.replace((returnTo || "/(tabs)/home") as Href);
  }

  function handleError(error: AuthApiError, fallback: string) {
    toast.show({ variant: "danger", label: resolveErrorMessage(error, fallback) });
  }

  async function signIn(email: string, password: string, returnTo?: string) {
    await authClient.signIn.email(
      { email, password },
      {
        onSuccess: () => handleSuccess(t("toast.signInSuccess"), returnTo),
        onError: (ctx) => handleError(ctx.error, t("toast.signInError", "Failed to sign in")),
      },
    );
  }

  async function signUp(email: string, password: string, name: string, returnTo?: string) {
    await authClient.signUp.email(
      { email, password, name },
      {
        onSuccess: () => handleSuccess(t("toast.signUpSuccess"), returnTo),
        onError: (ctx) => handleError(ctx.error, t("toast.signUpError", "Failed to sign up")),
      },
    );
  }

  async function signInWithGoogle(returnTo?: string) {
    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: returnTo || "/home",
        errorCallbackURL: "/(auth)/login",
      },
      {
        onSuccess: () => handleSuccess(t("toast.signInSuccess"), returnTo),
        onError: (ctx) =>
          handleError(ctx.error, t("toast.signInError", "Failed to sign in with Google")),
      },
    );
  }

  async function signOut() {
    try {
      await authClient.signOut();
      toast.show({ variant: "success", label: t("toast.signOutSuccess") });
      router.replace("/(auth)/login" as Href);
    } catch {
      toast.show({ variant: "danger", label: t("toast.signOutError") });
    }
  }

  return {
    session,
    user: session?.user ?? null,
    loading: isPending,
    error: sessionError ? resolveErrorMessage(sessionError, "") : null,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };
}
