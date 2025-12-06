export interface Env {
  ALLOWED_API_KEYS?: string;
  EDGE_REGION: string;
  EDGE_VOICE_DEFAULT: string;
}

export interface TtsRequestPayload {
  text: string;
  voice_id?: string;
  speed?: number; // -1.0 ~ 2.0
  tone?: "neutral" | "warm" | "news";
  audio_format?: "mp3" | "ogg" | "wav";
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface VoiceInfo {
  id: string;
  name: string;
  language: string;
  gender: "male" | "female" | "unknown";
  tags: string[];
}
