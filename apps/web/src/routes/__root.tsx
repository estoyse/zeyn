import { Toaster } from "@shaxsiy-oyin/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
  useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { ThemeProvider } from "@/shared/components/theme-provider";
import type { trpc } from "@/shared/lib/trpc";

import "../index.css";
import { Header } from "@/features/landing/components/Header";
import { AppHeader } from "@/shared/components/app/AppHeader";

export interface RouterAppContext {
  trpc: typeof trpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "shaxsiy-oyin",
      },
      {
        name: "description",
        content: "shaxsiy-oyin is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  const location = useLocation();
  const isAppPage = /^\/(dashboard|games?)(\/|$)/.test(location.pathname);
  const isLoginPage = location.pathname.startsWith("/auth");
  const isLandingPage = location.pathname === "/";

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute='class'
        defaultTheme='light'
        disableTransitionOnChange
        storageKey='vite-ui-theme'
      >
        <div
          className={
            isAppPage || isLoginPage
              ? "grid grid-rows-[auto_1fr] h-svh"
              : "min-h-svh"
          }
        >
          {!isLoginPage && (isAppPage ? <AppHeader /> : isLandingPage ? <Header /> : null)}
          <Outlet />
        </div>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position='bottom-left' />
      <ReactQueryDevtools position='bottom' buttonPosition='bottom-right' />
    </>
  );
}
