const EVE_ROUTE_PREFIX = "/eve/v1";
const DEFAULT_EVE_DEV_ORIGIN = "http://127.0.0.1:4274";

export function isEveRoute(pathname: string): boolean {
  return pathname === EVE_ROUTE_PREFIX || pathname.startsWith(`${EVE_ROUTE_PREFIX}/`);
}

function resolveEveOrigin(): string | null {
  const configured = process.env.EVE_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  if (process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "development") {
    return DEFAULT_EVE_DEV_ORIGIN;
  }

  return null;
}

export async function proxyEveRequest(request: Request): Promise<Response | null> {
  const origin = resolveEveOrigin();
  if (!origin) return null;

  const url = new URL(request.url);
  const target = new URL(`${origin}${url.pathname}${url.search}`);

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");

  try {
    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: "manual",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
      (init as RequestInit & { duplex?: "half" }).duplex = "half";
    }

    return await fetch(target, init);
  } catch (error) {
    console.error("Eve proxy request failed:", error);
    return new Response(
      JSON.stringify({
        error: "Eve agent unavailable. Start it with `npm run dev:eve` in another terminal.",
      }),
      {
        status: 503,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
