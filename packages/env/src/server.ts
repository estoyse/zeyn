/// <reference path="../env.d.ts" />
// For Cloudflare Workers, env is accessed via cloudflare:workers module
// Types are defined in env.d.ts based on your alchemy.run.ts bindings
import { type Cloudflare } from "cloudflare:workers";
export { env } from "cloudflare:workers";
export type Env = Cloudflare.Env;
