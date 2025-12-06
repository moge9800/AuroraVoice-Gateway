import type { Env, ApiErrorBody, TtsRequestPayload } from "./models";
import { getAvailableVoices, synthesizeWithEdge } from "./edgeClient";
import { validateApiKey } from "./config";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function errorBody(code: string, message: string, details?: unknown): ApiErrorBody {
  return { code, message, details };
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // 统一的 API Key 校验（允许访问 /health 无需 key）
  if (!path.startsWith("/api/health") && !validateApiKey(env, request)) {
    return json(errorBody("UNAUTHORIZED", "Invalid or missing X-Api-Key"), 401);
  }

  if (request.method === "GET" && path === "/api/health") {
    return json({
      status: "ok",
      time: new Date().toISOString()
    });
  }

  if (request.method === "GET" && path === "/api/voices") {
    const voices = getAvailableVoices(env);
    return json({ voices });
  }

  if (request.method === "POST" && path === "/api/tts/synthesize") {
    let payload: TtsRequestPayload;
    try {
      payload = (await request.json()) as TtsRequestPayload;
    } catch {
      return json(errorBody("BAD_JSON", "Request body must be valid JSON"), 400);
    }
    return synthesizeWithEdge(env, payload);
  }

  return json(errorBody("NOT_FOUND", `No route for ${request.method} ${path}`), 404);
}
