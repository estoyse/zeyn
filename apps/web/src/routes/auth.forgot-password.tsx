import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { GalleryVerticalEnd } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (session.data) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link to="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Shaxsiy O'yin
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <AnimatePresence mode="wait">
              <ForgotPasswordForm
                key="forgot"
                onBack={() => navigate({ to: "/auth/login" })}
              />
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/login.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.5] dark:grayscale"
        />
      </div>
    </div>
  );
}