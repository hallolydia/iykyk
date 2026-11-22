// POST /api/analyze
// Reads English comments the way someone raised outside the US would,
// and returns only the phrases they would likely miss.
// The API key lives only here, on the server.
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";

export const MODEL = "claude-opus-5-5";
export const PROMPT_VERSION = "v2";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

const Item = z.object({
  comment_id: z.string(),
  quote: z.string().describe("The exact text from the comment, copied character for character"),
  question: z.enum(["funny", "reference", "tone"]),
  answer: z.string().describe("One or two short sentences, like a friend explaining over text"),
  emoji: z.object({ char: z.string(), meaning: z.string() }).nullable()
    .describe("Only when an emoji in the quote carries the meaning; else null"),
  origin: z.string().describe("One short line on where the phrase comes from, or empty"),
  closest: z.string().describe("The closest thing in the reader's home culture, only if a real match exists, or empty"),
  confidence: z.number().describe("0 to 1. How sure you are about this explanation")
});
const Result = z.object({ items: z.array(Item) });

export const SYSTEM_PROMPT = `You help people who grew up outside the US understand English social media comments.

The reader understands every word. What they miss is the context: memes, TV shows, sports, celebrities, US traditions, and tone (sarcasm, teasing, rude vs. friendly).

Your job: find only the HINGE of each comment. The hinge is the phrase the joke, reference, or tone depends on. If someone misses it, they misread the whole comment.

Flag a phrase only if an adult who grew up in the reader's country, with advanced English, would likely miss the meaning, the joke, or the tone, even though they know every word.

Do NOT flag:
- words that mean the same thing in a dictionary
- things that don't change the meaning if missed (e.g. "y'all", "lol")
- emojis or slang that mean the same thing worldwide
- anything the reader already knows (listed in KNOWN)

Rules:
- At most 2 flags per comment. Most comments need zero. Missing one joke is better than flagging everything.
- "quote" must be copied exactly from the comment text.
- Use the scene and caption to explain why THIS moment is funny, not just what the word means.
- The first item may be the post's caption. Use it as context for every comment.
- Names of brands, stores, TV channels, shows, and products can carry cultural meaning on their own. Treat them as possible hinges.
- In long comments, the punchline is usually near the end. Read to the end before choosing the hinge.
- If you are not sure what something refers to (for example a very new meme), say so in the answer and give a confidence below 0.7. Never invent a source.
- Sad or personal comments (grief, illness): explain the tone gently, never as a joke.
- "answer": one or two short sentences, warm and plain, like a friend texting. No lecturing.
- "closest": only if there is a real, close equivalent in the reader's home culture. Otherwise an empty string. Never stretch.
- Write answer, origin, and closest in the requested explanation language.`;

const COUNTRY_NAMES = { KR: "Korea", JP: "Japan", CN: "China", IN: "India", VN: "Vietnam", BR: "Brazil", MX: "Mexico", FR: "France" };

// ---- small guards for a public demo ----
const MAX_COMMENTS = 20;
const MAX_CHARS = 600;
const hits = new Map(); // ip -> [timestamps], best effort per instance
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 8; // 8 reads per minute per visitor
}

export function buildUserMessage({ post, country, known, explainIn }) {
  const comments = (post.comments || []).slice(0, MAX_COMMENTS).map((c) => ({
    id: String(c.id), text: String(c.text || "").slice(0, MAX_CHARS)
  }));
  const reader = country ? `grew up in ${COUNTRY_NAMES[country] || country}` : "grew up outside the US (country unknown)";
  return [
    `READER: ${reader}. Explain in ${explainIn === "ko" ? "Korean" : "English"}.`,
    `KNOWN (never flag these): ${known.length ? known.join(" | ") : "(none)"}`,
    `CAPTION: ${String(post.caption || "").slice(0, MAX_CHARS) || "(none)"}`,
    `SCENE: ${String(post.scene || "").slice(0, MAX_CHARS) || "(not provided)"}`,
    `COMMENTS (JSON):\n${JSON.stringify(comments, null, 1)}`
  ].join("\n\n");
}

export async function analyze(input, { system = SYSTEM_PROMPT } = {}) {
  const content = [];
  if (input.post.image && /^data:image\/(png|jpeg|webp);base64,/.test(input.post.image)) {
    const [, mediaType, data] = input.post.image.match(/^data:(image\/[a-z]+);base64,(.*)$/);
    content.push({ type: "image", source: { type: "base64", media_type: mediaType, data } });
  }
  content.push({ type: "text", text: buildUserMessage(input) });

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(Result) },
    system,
    messages: [{ role: "user", content }]
  });

  if (response.stop_reason === "refusal") return { items: [], refused: true };
  const parsed = response.parsed_output;
  if (!parsed) throw new Error("No structured output");

  // Code-side checks: the quote must exist in that comment; cap 2 per comment.
  const byId = Object.fromEntries(input.post.comments.map((c) => [String(c.id), String(c.text)]));
  const perComment = {};
  const items = parsed.items.filter((it) => {
    const text = byId[it.comment_id];
    if (!text || !it.quote || !text.includes(it.quote)) return false;
    perComment[it.comment_id] = (perComment[it.comment_id] || 0) + 1;
    return perComment[it.comment_id] <= 2;
  });
  return { items, dropped: parsed.items.length - items.length, model: response.model, prompt: PROMPT_VERSION };
}

export default async function handler(req, res) {
  // the extension and the demo page both call this
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "anon").split(",")[0].trim();
  if (rateLimited(ip)) return res.status(429).json({ error: "Too many reads. Try again in a minute." });

  const body = req.body || {};
  const post = body.post;
  if (!post || !Array.isArray(post.comments) || !post.comments.length) {
    return res.status(400).json({ error: "No comments to read." });
  }
  const known = Array.isArray(body.known) ? body.known.map(String).slice(0, 300) : [];
  try {
    const result = await analyze({ post, country: body.country || null, known, explainIn: body.explainIn || "en" });
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "AI is busy. Try again soon." });
    if (err instanceof Anthropic.AuthenticationError) return res.status(500).json({ error: "Server key problem." });
    if (err instanceof Anthropic.APIError) return res.status(502).json({ error: `AI error ${err.status}` });
    return res.status(500).json({ error: "Couldn't read this one." });
  }
}
