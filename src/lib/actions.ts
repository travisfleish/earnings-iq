"use server";

import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getAnalysisForTicker } from "@/lib/getAnalysis";
import { getLiveQuoteForTicker, type LiveQuote } from "@/lib/getLiveQuote";
import { getScorecardForTicker } from "@/lib/getScorecard";
import {
  getPodcastForTicker,
  preparePodcastScript,
  synthesizePodcastAudio,
  type PodcastAudioResult,
  type PodcastResult,
  type PodcastScriptResult,
} from "@/lib/getPodcast";
import type { EarningsAnalysis, Scorecard } from "@/lib/types";

export type { PodcastAudioResult, PodcastResult, PodcastScriptResult };

export type { LiveQuote };

const tickerSchema = z.object({ ticker: z.string().min(1).max(10) });

const scorecardSchema = z.object({
  ticker: z.string().min(1).max(10),
  companyName: z.string().max(200).optional(),
  sector: z.string().max(100).optional(),
  callSummary: z.string().max(4000).optional(),
  themes: z.array(z.string()).max(20).optional(),
  sentimentScore: z.number().optional(),
});

const podcastScriptSchema = z.object({
  script: z.string().min(1).max(5000),
});

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

export async function fetchLiveQuote(input: { ticker: string }): Promise<LiveQuote | null> {
  const data = tickerSchema.parse(input);
  return getLiveQuoteForTicker(data.ticker);
}

export async function fetchAnalysis(input: { ticker: string }): Promise<EarningsAnalysis | null> {
  const data = tickerSchema.parse(input);
  return getAnalysisForTicker(data.ticker);
}

export async function fetchScorecard(input: z.infer<typeof scorecardSchema>): Promise<Scorecard | null> {
  const data = scorecardSchema.parse(input);
  return getScorecardForTicker(data);
}

export async function generatePodcast(input: { ticker: string }): Promise<PodcastResult> {
  const data = tickerSchema.parse(input);
  return getPodcastForTicker(data.ticker);
}

export async function fetchPodcastScript(input: { ticker: string }): Promise<PodcastScriptResult> {
  const data = tickerSchema.parse(input);
  return preparePodcastScript(data.ticker);
}

export async function fetchPodcastAudio(input: { script: string }): Promise<PodcastAudioResult> {
  const data = podcastScriptSchema.parse(input);
  return synthesizePodcastAudio(data.script);
}

export async function subscribeNewsletter(input: { email: string }) {
  const data = emailSchema.parse(input);
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Backend not configured");

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("newsletter_subscribers").insert({ email: data.email });

  if (error && error.code !== "23505") {
    return { ok: false as const, message: error.message };
  }
  return { ok: true as const };
}
