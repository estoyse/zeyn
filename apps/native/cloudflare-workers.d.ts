declare module "cloudflare:workers" {
  export namespace Cloudflare {
    interface Env {}
  }
  export const env: Cloudflare.Env;
}
