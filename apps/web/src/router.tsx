import { QueryClientProvider } from "@tanstack/react-query";
import { type RouterHistory, createRouter } from "@tanstack/react-router";
import { Suspense } from "react";
import { I18nextProvider } from "react-i18next";

import Loader from "./shared/components/loader";
import i18n from "./shared/i18n/config";
import { routeTree } from "./routeTree.gen";
import { queryClient, trpc } from "./shared/lib/trpc";

export interface CreateAppRouterOptions {
  history?: RouterHistory;
}

export function createAppRouter(options: CreateAppRouterOptions = {}) {
  return createRouter({
    routeTree,
    history: options.history,
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultPendingComponent: () => <Loader />,
    context: { trpc, queryClient },
    Wrap: function WrapComponent({ children }: { children: React.ReactNode }) {
      return (
        <Suspense fallback={null}>
          <I18nextProvider i18n={i18n}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
          </I18nextProvider>
        </Suspense>
      );
    },
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
