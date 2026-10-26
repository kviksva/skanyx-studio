/**
 * Thin ElevenLabs client for the three calls the studio makes. No SDK: the
 * endpoints are stable and a dependency would only hide the request shape.
 * API reference: https://elevenlabs.io/docs/api-reference (checked 2026-10-26).
 */
import { require as requireEnv } from "../lib/env";

const BASE = "https://api.elevenlabs.io";

const headers = () => ({
  "xi-api-key": requireEnv("elevenlabsApiKey", "Create a studio-scoped key in ElevenLabs > Settings > API Keys."),
  "Content-Type": "application/json",
});

export type TtsRequest = {
  voiceId: string;
  text: string;
  modelId?: "eleven_v4" | "eleven_multilingual_v2";
  languageCode?: string;
  outputFormat?: string;
  seed?: number;
  previousRequestIds?: string[];
  nextRequestIds?: string[];
  voiceSettings?: { stability?: number; similarity_boost?: number; speed?: number; style?: number };
  dictionary?: { id: string; versionId: string } | null;
  applyTextNormalization?: "auto" | "on" | "off";
};

export type TtsResponse = {
  audioBase64: string;
  alignment: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] } | null;
  normalizedAlignment: TtsResponse["alignment"];
  requestId: string | null;
};

/** POST /v1/text-to-speech/{voice}/with-timestamps */
export const ttsWithTimestamps = async (r: TtsRequest): Promise<TtsResponse> => {
  const url = new URL(`${BASE}/v1/text-to-speech/${r.voiceId}/with-timestamps`);
  url.searchParams.set("output_format", r.outputFormat ?? "pcm_48000");
  const body: Record<string, unknown> = {
    text: r.text,
    model_id: r.modelId ?? "eleven_v4",
    apply_text_normalization: r.applyTextNormalization ?? "off",
  };
  if (r.languageCode) body.language_code = r.languageCode;
  if (r.seed !== undefined) body.seed = r.seed;
  if (r.previousRequestIds?.length) body.previous_request_ids = r.previousRequestIds.slice(-3);
  if (r.nextRequestIds?.length) body.next_request_ids = r.nextRequestIds.slice(0, 3);
  if (r.voiceSettings) body.voice_settings = r.voiceSettings;
  if (r.dictionary) {
    body.pronunciation_dictionary_locators = [
      { pronunciation_dictionary_id: r.dictionary.id, version_id: r.dictionary.versionId },
    ];
  }
  const res = await fetch(url, { method: "POST", headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`ElevenLabs TTS ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as {
    audio_base64: string;
    alignment: TtsResponse["alignment"];
    normalized_alignment: TtsResponse["alignment"];
  };
  return {
    audioBase64: json.audio_base64,
    alignment: json.alignment,
    normalizedAlignment: json.normalized_alignment,
    requestId: res.headers.get("request-id"),
  };
};

export type DictionaryRule =
  | { type: "alias"; string_to_replace: string; alias: string }
  | { type: "phoneme"; string_to_replace: string; phoneme: string; alphabet: "ipa" | "cmu-arpabet" };

/** POST /v1/pronunciation-dictionaries/add-from-rules */
export const createDictionary = async (name: string, rules: DictionaryRule[], description?: string) => {
  const res = await fetch(`${BASE}/v1/pronunciation-dictionaries/add-from-rules`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name, rules, description }),
  });
  if (!res.ok) throw new Error(`ElevenLabs dictionary ${res.status}: ${await res.text()}`);
  return (await res.json()) as { id: string; version_id: string; name: string };
};

export type SharedVoice = {
  voice_id: string;
  public_owner_id: string;
  name: string;
  accent: string;
  gender: string;
  age: string;
  language: string;
  use_case: string;
  category: string;
  description: string;
  notice_period?: number;
  live_moderation_enabled?: boolean;
  free_users_allowed?: boolean;
};

/** GET /v1/shared-voices: the Voice Library, filtered. */
export const searchVoiceLibrary = async (q: Record<string, string>): Promise<SharedVoice[]> => {
  const url = new URL(`${BASE}/v1/shared-voices`);
  for (const [k, v] of Object.entries(q)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(`ElevenLabs shared-voices ${res.status}: ${await res.text()}`);
  return ((await res.json()) as { voices: SharedVoice[] }).voices;
};

/** POST /v1/voices/add-shared/{owner}/{voice}: add a Library voice to our account. */
export const addSharedVoice = async (ownerId: string, voiceId: string, newName: string) => {
  const res = await fetch(`${BASE}/v1/voices/add-shared/${ownerId}/${voiceId}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ new_name: newName }),
  });
  if (!res.ok) throw new Error(`ElevenLabs add-shared ${res.status}: ${await res.text()}`);
  return (await res.json()) as { voice_id: string };
};
