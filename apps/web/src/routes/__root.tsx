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

import { ThemeProvider } from "@/components/theme-provider";
import type { trpc } from "@/utils/trpc";

import "../index.css";
import { Header } from "@/components/landing/Header";
import { AppHeader } from "@/components/app/AppHeader";

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
  const isAppPage = location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/game");
  const isLoginPage = location.pathname === "/login";

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute='class'
        defaultTheme='light'
        disableTransitionOnChange
        storageKey='vite-ui-theme'
      >
        <div className='grid grid-rows-[auto_1fr] h-svh'>
          {!isLoginPage && (isAppPage ? <AppHeader /> : <Header />)}
          <Outlet />
        </div>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position='bottom-left' />
      <ReactQueryDevtools position='bottom' buttonPosition='bottom-right' />
    </>
  );
}
