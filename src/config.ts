import type { Env } from "./models";

export function parseAllowedKeys(env: Env): Set<string> | null {
  if (!env.ALLOWED_API_KEYS) return null;
  const keys = env.ALLOWED_API_KEYS
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return keys.length ? new Set(keys) : null;
}

export function validateApiKey(env: Env, request: Request): boolean {
  const allowed = parseAllowedKeys(env);
  if (!allowed) return true; // 不配置则不启用 API Key 校验

  const headerKey = request.headers.get("X-Api-Key") || "";
  return allowed.has(headerKey);
}

export function getDefaultVoice(env: Env): string {
  return env.EDGE_VOICE_DEFAULT || "zh-CN-XiaoxiaoNeural";
}
