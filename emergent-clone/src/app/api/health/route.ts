import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight status endpoint so you can confirm — at a glance — which AI
// provider the build agent will actually use, without running a full build.
//   GET /api/health           → JSON status
//   GET /api/health?ping=1    → also makes a tiny live call to the provider
export async function GET(req: Request) {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openRouterModel = process.env.OPENROUTER_MODEL || "z-ai/glm-5.2";
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const anthropicModel = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

  const provider = openRouterKey
    ? "openrouter"
    : anthropicKey
      ? "anthropic"
      : "simulation";

  const status: Record<string, unknown> = {
    provider,
    model:
      provider === "openrouter"
        ? openRouterModel
        : provider === "anthropic"
          ? anthropicModel
          : null,
    keys: {
      openrouter: Boolean(openRouterKey),
      anthropic: Boolean(anthropicKey),
    },
    live: provider !== "simulation",
    note:
      provider === "simulation"
        ? "No API key detected — builds use the built-in streamed simulation."
        : `Builds will stream from ${provider}.`,
  };

  // Optional live probe: /api/health?ping=1 actually hits the provider.
  const url = new URL(req.url);
  if (url.searchParams.get("ping") && provider === "openrouter") {
    try {
      const res = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: openRouterModel,
            max_tokens: 5,
            messages: [{ role: "user", content: "ping" }],
          }),
        },
      );
      status.ping = {
        ok: res.ok,
        httpStatus: res.status,
        detail: res.ok ? "reachable" : (await res.text()).slice(0, 200),
      };
    } catch (err) {
      status.ping = {
        ok: false,
        detail: err instanceof Error ? err.message : "request failed",
      };
    }
  }

  return NextResponse.json(status);
}
