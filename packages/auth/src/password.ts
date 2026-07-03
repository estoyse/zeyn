import { argon2id, argon2Verify, setWASMModules } from "argon2-wasm-edge";
import { APIError } from "better-auth/api";
// @ts-ignore
import argon2Wasm from "argon2-wasm-edge/wasm/argon2.wasm";
// @ts-ignore
import blake2bWasm from "argon2-wasm-edge/wasm/blake2b.wasm";

// Pre-compile WASM modules for Cloudflare Workers compatibility
setWASMModules({ 
  argon2WASM: argon2Wasm, 
  blake2bWASM: blake2bWasm 
});

const opts = {
  memorySize: 65536, // 64 MiB
  iterations: 3,
  parallelism: 4,
  hashLength: 32,
  outputType: "encoded" as const,
};

/**
 * Hashes a password using Argon2id with WASM-precompiled modules.
 * Compatible with Cloudflare Workers security policies.
 */
export async function hashPassword(password: string) {
  if (password.length < 8) {
    throw new APIError("BAD_REQUEST", {
      message: "Password must be at least 8 characters",
    });
  }
  if (!/[0-9]/.test(password)) {
    throw new APIError("BAD_REQUEST", {
      message: "Password must contain at least 1 number",
    });
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return await argon2id({
    ...opts,
    password,
    salt,
  });
}

/**
 * Verifies a password against an Argon2id hash.
 * Uses pre-compiled WASM modules to avoid runtime compilation errors.
 */
export async function verifyPassword(data: { password: string; hash: string }) {
  const { password, hash } = data;
  try {
    return await argon2Verify({
      password,
      hash,
    });
  } catch (e) {
    console.error("Argon2 verification failed:", e);
    return false;
  }
}
