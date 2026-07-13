import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Msg = { role: "user" | "assistant"; content: string };

const SYSTEM = `You are Emergent, an agentic vibe-coding platform. A coordinated team of five AI agents works together to ship production-ready full-stack apps: Architect (plans data models, API contracts, page structure), Designer (UI/UX, design tokens, layout), Developer (React + Next.js frontend, FastAPI backend, MongoDB), Integration (payments, auth, third-party APIs), and QA & Deploy (tests, self-heals, deploys with a live URL and GitHub sync).

When the user describes an app for the first time, respond as the build orchestrator. Be concise and energetic. Structure your reply as:
1. A one-line confirmation of what you're building.
2. A short "Build plan" — 4-6 bullets attributed to the relevant agents.
3. A "Tech stack" line (React/Next.js, FastAPI, MongoDB, plus any integrations).
4. A closing line noting the app is deployed to a live URL and synced to GitHub.

For follow-up messages, respond as a helpful build assistant making the requested change. Keep replies tight (under ~180 words), practical, and never invent that you cannot help. Use markdown. Do not use headings larger than ###.`;

function sse(text: string) {
  return new TextEncoder().encode(text);
}

// Deterministic-ish simulated build narration when no API key is configured.
function simulate(messages: Msg[]): string {
  const last = messages[messages.length - 1]?.content ?? "an app";
  const isFirst = messages.filter((m) => m.role === "user").length <= 1;
  if (isFirst) {
    const feature = last.length > 90 ? last.slice(0, 90) + "…" : last;
    return `Building: **${feature}**

### Build plan
- **Architect** — modeled core entities, defined REST endpoints, and mapped the page hierarchy.
- **Designer** — generated a clean design system with responsive layouts and accessible states.
- **Developer** — scaffolded the React + Next.js frontend and a FastAPI backend on MongoDB.
- **Integration** — wired authentication and the third-party services this app needs.
- **QA & Deploy** — ran integration tests, self-healed two runtime errors, and shipped it.

**Tech stack:** React · Next.js · FastAPI · MongoDB · JWT auth

Your app is **live** at a preview URL and the code is synced to GitHub — you own all of it. Want to tweak the design, add a feature, or connect payments? Just tell me.`;
  }
  return `On it. I've applied that change:

- Updated the relevant components and API routes
- Re-ran the build and tests — all green
- Redeployed to your live preview URL

Anything else you'd like to adjust?`;
}

async function* streamWords(text: string) {
  const tokens = text.match(/\S+\s*/g) ?? [text];
  for (const t of tokens) {
    yield t;
    // small delay for a natural typing cadence
    await new Promise((r) => setTimeout(r, 12));
  }
}

export async function POST(req: Request) {
  let messages: Msg[] = [];
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (apiKey) {
          const client = new Anthropic({ apiKey });
          const anthropicStream = await client.messages.stream({
            model,
            max_tokens: 1024,
            system: SYSTEM,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          });
          for await (const event of anthropicStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(sse(event.delta.text));
            }
          }
        } else {
          // No key — stream the built-in simulation so the demo still works.
          for await (const chunk of streamWords(simulate(messages))) {
            controller.enqueue(sse(chunk));
          }
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unexpected error during build.";
        controller.enqueue(
          sse(`\n\n_(The build agent hit an error: ${msg})_`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
