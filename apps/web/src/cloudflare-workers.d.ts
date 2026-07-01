// The web app imports only the AppRouter *type* from the server. That type
// graph transitively references `@shaxsiy-oyin/env/server`, which imports the
// Worker-only `cloudflare:workers` module. The browser build never runs that
// code, so instead of pulling all of @cloudflare/workers-types into the DOM
// type scope (which conflicts with lib.dom's Response/WebSocket/etc.), we give
// tsc a minimal ambient declaration just so the module resolves.
declare module "cloudflare:workers" {
  // `any` because this binding is never read in the browser build; typing it
  // more strictly would surface false errors in server-only code (e.g. the auth
  // package's env.BETTER_AUTH_URL) that the web app only pulls in as types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const env: any;
  export namespace Cloudflare {
    // `interface` (not `type`) so it merges cleanly with the augmentation in
    // packages/env/env.d.ts if that ever gets loaded.
    interface Env {
      [key: string]: unknown;
    }
  }
}
