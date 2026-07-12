const AI_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

export function getAiGatewayAuthHeader(): string | null {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (apiKey) return `Bearer ${apiKey}`;

  const oidcToken = process.env.VERCEL_OIDC_TOKEN;
  if (oidcToken) return `Bearer ${oidcToken}`;

  return null;
}

export async function chatCompletionJson<T>(options: {
  model?: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}): Promise<T | null> {
  const auth = getAiGatewayAuthHeader();
  if (!auth) return null;

  const model = options.model ?? process.env.AI_SCORECARD_MODEL ?? "google/gemini-2.5-flash";

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
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`AI Gateway ${res.status}: ${body}`);
      return null;
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content) as T;
  } catch (err) {
    console.error("AI Gateway request failed:", err);
    return null;
  }
}
