import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { renderToString } from "react-dom/server";

import i18n from "./shared/i18n/config";
import { createAppRouter } from "./router";

export async function renderRoute(url: string, locale: string) {
  await i18n.changeLanguage(locale);

  const router = createAppRouter({
    history: createMemoryHistory({ initialEntries: [url] }),
  });

  await router.load();

  return renderToString(<RouterProvider router={router} />);
}
