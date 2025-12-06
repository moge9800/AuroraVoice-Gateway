import type { Env, TtsRequestPayload, VoiceInfo } from "./models";

function toneToPitch(tone?: string): string {
  switch (tone) {
    case "warm":
      return "+10%";
    case "news":
      return "+5%";
    default:
      return "0%";
  }
}

function speedToRate(speed?: number): string {
  if (typeof speed !== "number") return "0%";
  const clamped = Math.max(-1, Math.min(2, speed));
  const percent = Math.round((clamped - 1) * 100); // -100% ~ 100%
  return `${percent}%`;
}

// 示例：静态 voice 列表，可以后续接 Edge 接口动态加载
export function getAvailableVoices(env: Env): VoiceInfo[] {
  return [
    {
      id: env.EDGE_VOICE_DEFAULT,
      name: "Mandarin Female Narrator",
      language: "zh-CN",
      gender: "female",
      tags: ["narration", "default"]
    },
    {
      id: "en-US-JennyNeural",
      name: "English US Female",
      language: "en-US",
      gender: "female",
      tags: ["podcast", "friendly"]
    },
    {
      id: "ja-JP-NanamiNeural",
      name: "Japanese Female",
      language: "ja-JP",
      gender: "female",
      tags: ["anime", "variety"]
    }
  ];
}

export async function synthesizeWithEdge(
  env: Env,
  payload: TtsRequestPayload
): Promise<Response> {
  if (!payload.text || !payload.text.trim()) {
    return new Response(
      JSON.stringify({
        code: "INVALID_TEXT",
        message: "text must not be empty"
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const voice = payload.voice_id || env.EDGE_VOICE_DEFAULT;
  const rate = speedToRate(payload.speed);
  const pitch = toneToPitch(payload.tone);
  const format = payload.audio_format || "mp3";

  // 这里演示一个“伪逻辑”：构造 SSML 字符串，实际需要按 Edge TTS 接口要求发送
  const ssml = `<speak version="1.0" xml:lang="en-US">
    <voice name="${voice}">
      <prosody rate="${rate}" pitch="${pitch}">
        ${payload.text}
      </prosody>
    </voice>
  </speak>`;

  // 示例：向“Edge TTS 代理/中间服务”发起请求（你可以自己托管该接口）
  // 为避免复刻任何现有项目，这里不写具体 URL，只用占位符
  const upstreamUrl = `https://your-edge-tts-upstream.example.com/synthesize`;

  const upstreamResp = await fetch(upstreamUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/ssml+xml",
      "Accept": "audio/mpeg"
    },
    body: ssml
  });

  if (!upstreamResp.ok) {
    const text = await upstreamResp.text().catch(() => "");
    return new Response(
      JSON.stringify({
        code: "UPSTREAM_ERROR",
        message: `Edge TTS upstream error: ${upstreamResp.status}`,
        details: text.slice(0, 500)
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  // 将上游音频流式透传给客户端
  const contentType =
    format === "wav" ? "audio/wav" : format === "ogg" ? "audio/ogg" : "audio/mpeg";
  const readable = upstreamResp.body;

  if (!readable) {
    return new Response(
      JSON.stringify({
        code: "EMPTY_AUDIO",
        message: "Upstream returned no audio data"
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(readable, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
      "X-Aurora-Voice": voice
    }
  });
}
