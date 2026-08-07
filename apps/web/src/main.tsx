import { RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import "./shared/i18n/config";
import { createAppRouter } from "./router";

const router = createAppRouter();

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = ReactDOM.createRoot(rootElement);
root.render(<RouterProvider router={router} />);
