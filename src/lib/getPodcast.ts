import { getAnalysisForTicker } from "@/lib/getAnalysis";
import { arrayBufferToBase64, getElevenLabsApiKey, textToSpeech } from "@/lib/elevenlabs";
import { analysisToPodcastScript, podcastTitle } from "@/lib/podcastScript";

export type PodcastScriptResult =
  | {
      ok: true;
      script: string;
      title: string;
      ticker: string;
      companyName: string;
      earningsQuarter: string;
    }
  | { ok: false; message: string };

export type PodcastAudioResult =
  | { ok: true; audioBase64: string; mimeType: string }
  | { ok: false; message: string };

export type PodcastResult =
  | {
      ok: true;
      audioBase64: string;
      mimeType: string;
      script: string;
      title: string;
    }
  | { ok: false; message: string };

export async function preparePodcastScript(ticker: string): Promise<PodcastScriptResult> {
  const analysis = await getAnalysisForTicker(ticker);
  if (!analysis) {
    return { ok: false, message: `No earnings analysis found for ${ticker.toUpperCase()}.` };
  }

  return {
    ok: true,
    script: analysisToPodcastScript(analysis),
    title: podcastTitle(analysis),
    ticker: analysis.profile.ticker,
    companyName: analysis.profile.name,
    earningsQuarter: analysis.profile.earningsQuarter,
  };
}

export async function synthesizePodcastAudio(script: string): Promise<PodcastAudioResult> {
  if (!getElevenLabsApiKey()) {
    return {
      ok: false,
      message: "Podcast generation is not configured. Add ELEVENLABS_API_KEY to your environment.",
    };
  }

  const tts = await textToSpeech(script);
  if (!tts) {
    return {
      ok: false,
      message: "Could not generate audio. Check your ElevenLabs API key and quota.",
    };
  }

  return {
    ok: true,
    audioBase64: arrayBufferToBase64(tts.audio),
    mimeType: tts.mimeType,
  };
}

export async function getPodcastForTicker(ticker: string): Promise<PodcastResult> {
  const prepared = await preparePodcastScript(ticker);
  if (!prepared.ok) return prepared;

  const audio = await synthesizePodcastAudio(prepared.script);
  if (!audio.ok) return audio;

  return {
    ok: true,
    audioBase64: audio.audioBase64,
    mimeType: audio.mimeType,
    script: prepared.script,
    title: prepared.title,
  };
}
