const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

/** Sarah — mature, confident narrator (works on free ElevenLabs plans). */
const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
const DEFAULT_MODEL_ID = "eleven_turbo_v2_5";

export function getElevenLabsApiKey(): string | null {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  return key || null;
}

export function getElevenLabsVoiceId(): string {
  return process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_VOICE_ID;
}

export interface TextToSpeechResult {
  audio: ArrayBuffer;
  mimeType: string;
}

export async function textToSpeech(text: string): Promise<TextToSpeechResult | null> {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) return null;

  const voiceId = getElevenLabsVoiceId();
  const modelId = process.env.ELEVENLABS_MODEL_ID?.trim() || DEFAULT_MODEL_ID;
  const outputFormat = "mp3_44100_128";

  try {
    const res = await fetch(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}?output_format=${outputFormat}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error(`ElevenLabs ${res.status}: ${body}`);
      return null;
    }

    const audio = await res.arrayBuffer();
    return { audio, mimeType: "audio/mpeg" };
  } catch (err) {
    console.error("ElevenLabs request failed:", err);
    return null;
  }
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}
