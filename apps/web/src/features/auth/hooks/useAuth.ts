import { authClient } from "@/features/auth/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null | undefined;
  email: string | null | undefined;
  image: string | null | undefined;
}

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string, returnTo?: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    username?: string,
    returnTo?: string
  ) => Promise<void>;
  signInWithGoogle: (returnTo?: string) => void;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();

  // Subscribe to better-auth's shared session store. Every component that calls
  // useAuth reads the same store, so the session is fetched once and reused —
  // instead of each consumer issuing its own /api/auth/get-session request.
  // better-auth updates this store automatically on sign in / sign out.
  const { data: session, isPending } = authClient.useSession();

  const user: User | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
    : null;

  const signIn = async (email: string, password: string, returnTo?: string) => {
    await authClient.signIn.email(
      { email, password },
      {
        onSuccess: () => {
          toast.success("Kirish muvaffaqiyatli");
          navigate({ to: returnTo || "/dashboard" });
        },
        onError: (error) => {
          toast.error(error.error.message || error.error.statusText);
        },
      }
    );
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    username?: string,
    returnTo?: string
  ) => {
    await authClient.signUp.email(
      { email, password, name, ...(username ? { username } : {}) },
      {
        onSuccess: () => {
          toast.success("Ro'yxatdan o'tish muvaffaqiyatli");
          navigate({ to: returnTo || "/dashboard" });
        },
        onError: (error) => {
          toast.error(error.error.message || error.error.statusText);
        },
      }
    );
  };

  const signInWithGoogle = (returnTo?: string) => {
    const redirectUrl = returnTo
      ? `${window.location.origin}/auth/verify?returnTo=${encodeURIComponent(returnTo)}`
      : undefined;
    authClient.signIn.social({ provider: "google", callbackURL: redirectUrl });
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Muvaffaqiyatli chiqildi");
      navigate({ to: "/" });
    } catch (error) {
      toast.error("Chiqishda xatolik");
    }
  };

  return { user, isLoading: isPending, signIn, signUp, signInWithGoogle, signOut };
}