const AI_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

export function getAiGatewayAuthHeader(): string | null {
  // Prefer API keys — they bill against purchased AI Gateway credits.
  // OIDC tokens from `vercel env pull` use the separate free monthly pool.
  const apiKey = process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_AI_API_KEY;
  if (apiKey?.trim()) return `Bearer ${apiKey.trim()}`;

  const oidcToken = process.env.VERCEL_OIDC_TOKEN;
  if (oidcToken) return `Bearer ${oidcToken}`;

  return null;
}

export async function chatCompletionJson<T>(options: {
  model?: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  /** When false, skips response_format (required for some models e.g. Perplexity). */
  jsonMode?: boolean;
}): Promise<T | null> {
  const auth = getAiGatewayAuthHeader();
  if (!auth) return null;

  const model = options.model ?? process.env.AI_SCORECARD_MODEL ?? "google/gemini-2.5-flash";
  const useJsonMode = options.jsonMode !== false && !model.includes("perplexity");

  try {
    const res = await fetch(`${AI_GATEWAY_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: JSON.stringify({
        model,
        messages: options.messages,
        ...(useJsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`AI Gateway ${res.status} (${model}): ${body}`);
      return null;
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;

    return parseJsonContent<T>(content);
  } catch (err) {
    console.error(`AI Gateway request failed (${model}):`, err);
    return null;
  }
}

function parseJsonContent<T>(content: string): T {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as T;
    }
    throw new Error("Response did not contain JSON");
  }
}
