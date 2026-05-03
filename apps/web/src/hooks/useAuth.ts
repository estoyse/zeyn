import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
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
  signUp: (email: string, password: string, name: string, returnTo?: string) => Promise<void>;
  signInWithGoogle: (returnTo?: string) => void;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const session = await authClient.getSession();
      if (session.data?.user) {
        setUser({
          id: session.data.user.id,
          name: session.data.user.name,
          email: session.data.user.email,
          image: session.data.user.image,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const signIn = async (email: string, password: string, returnTo?: string) => {
    setIsLoading(true);
    try {
      await authClient.signIn.email(
        { email, password },
        {
          onSuccess: () => {
            toast.success("Kirish muvaffaqiyatli");
            navigate({ to: returnTo || "/dashboard" });
            fetchUser();
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, returnTo?: string) => {
    setIsLoading(true);
    try {
      await authClient.signUp.email(
        { email, password, name },
        {
          onSuccess: () => {
            toast.success("Ro'yxatdan o'tish muvaffaqiyatli");
            navigate({ to: returnTo || "/dashboard" });
            fetchUser();
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = (returnTo?: string) => {
    const redirectUrl = returnTo
      ? `${window.location.origin}/auth/verify?returnTo=${encodeURIComponent(returnTo)}`
      : undefined;
    authClient.signIn.social({ provider: "google", callbackURL: redirectUrl });
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authClient.signOut();
      toast.success("Muvaffaqiyatli chiqildi");
      setUser(null);
      navigate({ to: "/" });
    } catch (error) {
      toast.error("Chiqishda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  return { user, isLoading, signIn, signUp, signInWithGoogle, signOut };
}