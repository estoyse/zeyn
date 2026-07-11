export interface RateLimiter {
  limit(input: { key: string }): Promise<{ success: boolean }>;
}

export async function enforceRateLimit(
  limiter: RateLimiter | null | undefined,
  key: string | null | undefined
): Promise<boolean> {
  if (!limiter || !key) return true;
  const { success } = await limiter.limit({ key });
  return success;
}
