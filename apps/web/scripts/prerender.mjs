import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(appRoot, "dist");
const shellPath = path.join(distDir, "index.html");
const prerenderEntry = path.join(appRoot, "src", "prerender.tsx");

const PRERENDER_LOCALE = "en";
const MIN_RENDERED_BYTES = 2000;
const APP_MOUNT_POINT = '<div id="app"></div>';

const ROUTES = [
  { url: "/home", outFile: "home.html" },
  { url: "/legal/privacy", outFile: "legal/privacy.html" },
  { url: "/legal/terms", outFile: "legal/terms.html" },
];

const LEADING_HEAD_TAG =
  /^\s*(?:<title\b[^>]*>[\s\S]*?<\/title>|<meta\b[^>]*?\/?>|<link\b[^>]*?\/?>)/;

function stripLeadingHeadTags(html) {
  let remaining = html;
  let match = LEADING_HEAD_TAG.exec(remaining);

  while (match) {
    remaining = remaining.slice(match[0].length);
    match = LEADING_HEAD_TAG.exec(remaining);
  }

  return remaining;
}

function revealAnimatedElements(html) {
  return html.replace(/ style="([^"]*)"/g, (whole, declarations) => {
    const kept = declarations
      .split(";")
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .filter((declaration) => !/^opacity:\s*0(?:\.0+)?$/i.test(declaration))
      .map((declaration) => {
        if (!/^transform:/i.test(declaration)) return declaration;

        const value = declaration
          .slice(declaration.indexOf(":") + 1)
          .replace(/\btranslate(?:X|Y|Z|3d)?\([^)]*\)/gi, "")
          .replace(/\s+/g, " ")
          .trim();

        return value && value !== "none" ? `transform:${value}` : "";
      })
      .filter(Boolean)
      .join(";");

    return kept ? ` style="${kept}"` : "";
  });
}

function buildPage(shell, renderedHtml) {
  return shell.replace(APP_MOUNT_POINT, `<div id="app">${renderedHtml}</div>`);
}

async function main() {
  const shell = await fs.readFile(shellPath, "utf8");

  if (!shell.includes(APP_MOUNT_POINT)) {
    throw new Error(
      `Could not find ${APP_MOUNT_POINT} in ${shellPath}. Run "vite build" first.`,
    );
  }

  const server = await createServer({
    root: appRoot,
    appType: "custom",
    logLevel: "warn",
    server: { middlewareMode: true },
  });

  try {
    const { renderRoute } = await server.ssrLoadModule(prerenderEntry);

    for (const { url, outFile } of ROUTES) {
      const rendered = await renderRoute(url, PRERENDER_LOCALE);

      if (rendered.length < MIN_RENDERED_BYTES) {
        throw new Error(
          `Prerendering ${url} produced only ${rendered.length} bytes, expected at least ${MIN_RENDERED_BYTES}.`,
        );
      }

      const body = revealAnimatedElements(stripLeadingHeadTags(rendered));
      const destination = path.join(distDir, outFile);

      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, buildPage(shell, body));

      console.log(
        `prerendered ${url} -> dist/${outFile} (${body.length} bytes of markup)`,
      );
    }
  } finally {
    await server.close();
  }
}

try {
  await main();
} catch (error) {
  console.error("Prerendering failed:", error);
  process.exit(1);
}
