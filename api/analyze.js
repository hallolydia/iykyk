// POST /api/analyze
// Reads English comments the way someone raised outside the US would,
// and returns only the phrases they would likely miss.
// The API key lives only here, on the server.
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";

export const MODEL = "claude-opus-5-5";
export const PROMPT_VERSION = "v3";

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
- If an AUDIO track is named, think about what that sound is known for on social media: its mood (sad violin, suspense, triumphant), how its melody is used in memes, or its lyrics. Comments often joke about the sound itself. If you don't know the track, don't guess.
- Images are frames from the video in order. Use expressions, actions, and on-screen text to understand the moment.
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
  return recent.length > 20; // 20 calls per minute per visitor (a scroll read can use 3)
}

export function buildUserMessage({ post, country, countries, known, explainIn, asked }) {
  const comments = (post.comments || []).slice(0, MAX_COMMENTS).map((c) => ({
    id: String(c.id), text: String(c.text || "").slice(0, MAX_CHARS)
  }));
  const list = (Array.isArray(countries) && countries.length ? countries : country ? [COUNTRY_NAMES[country] || country] : [])
    .map((c) => String(c).slice(0, 40)).slice(0, 3);
  const reader = list.length
    ? `grew up in ${list.join(" and ")}${list.length > 1 ? " (use the first place for \"closest\")" : ""}`
    : "grew up outside the US (country unknown)";
  return [
    `READER: ${reader}. Explain in ${explainIn === "ko" ? "Korean" : "English"}.${explainIn === "ko" ? " When explaining in Korean, every sentence ends in the polite 해요 style (…해요, …이에요/예요, …거예요, …있어요). Never casual speech (…야, …이야, …거야, …해) and never stiff formal endings (…합니다, …입니다). Write the way a kind Korean friend would explain over text: natural and easy to understand, never a word-for-word translation. Keep the English words the reader needs to learn (slang, idioms, names, show and brand titles, the key words of the joke) in English, with a short Korean gloss only when it helps." : ""}`,
    `KNOWN (never flag these): ${known.length ? known.join(" | ") : "(none)"}`,
    `CAPTION: ${String(post.caption || "").slice(0, MAX_CHARS) || "(none)"}`,
    `SCENE: ${String(post.scene || "").slice(0, MAX_CHARS) || "(see the images, if any)"}`,
    `AUDIO: ${String(post.audio || "").slice(0, 120) || "(unknown)"}`,
    `COMMENTS (JSON):\n${JSON.stringify(comments, null, 1)}`,
    ...(asked ? [`ASKED: The reader selected "${String(asked).slice(0, 160)}" and wants it explained. Return exactly one item for that phrase (quote must be that exact text, comment_id from COMMENTS), even if it would normally not be flagged. Ignore KNOWN for this one. If it needs no cultural context, say so plainly and set confidence honestly.`] : [])
  ].join("\n\n");
}

export async function analyze(input, { system = SYSTEM_PROMPT, effort = "medium", fast = false } = {}) {
  const content = [];
  const frames = [].concat(input.post.images || [], input.post.image || []).slice(0, 3);
  for (const img of frames) {
    const m = typeof img === "string" && img.match(/^data:(image\/(?:png|jpeg|webp));base64,(.*)$/);
    if (m) content.push({ type: "image", source: { type: "base64", media_type: m[1], data: m[2] } });
  }
  content.push({ type: "text", text: buildUserMessage(input) });

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort, format: betaZodOutputFormat(Result) },
    ...(fast ? { speed: "fast" } : {}),
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

// ---- translate the explanations already on screen (fast: a small model, no re-reading) ----
const Tr = z.object({ items: z.array(z.object({ id: z.string(), answer: z.string(), origin: z.string(), closest: z.string() })) });
const KO_STYLE = `

KOREAN STYLE (strict): every sentence ends in the polite 해요 style: …해요, …이에요/예요, …거예요, …있어요, …뜻이에요. Never casual speech (…야, …이야, …거야, …해, …어) and never stiff formal endings (…합니다, …입니다).
Wrong: "여자들이 싸운다는 뜻의 속어야." Right: "여자들이 싸운다는 뜻의 속어예요."
Wrong: "다들 자랑하고 있어." Right: "다들 자랑하고 있어요."`;
export async function translate({ items, to }) {
  const language = to === "ko" ? "natural, friendly Korean in the 해요 style" : "plain, friendly English, like a friend texting";
  const response = await client.beta.messages.parse({
    model: "claude-haiku-5-5",
    max_tokens: 4000,
    output_config: { format: betaZodOutputFormat(Tr) },
    system: `Rewrite the answer, origin and closest fields in ${language}. Do not translate word for word: make it read naturally and be easy to understand, as a native speaker would explain it to a friend. Keep the English words the reader needs to learn (slang, idioms, names, show and brand titles, the key words of the joke) in English, with a short gloss in the target language only when it helps. Do not add or remove information. An empty field stays empty. Return every id you were given.${to === "ko" ? KO_STYLE : ""}`,
    messages: [{ role: "user", content: JSON.stringify(items) }]
  });
  return { items: response.parsed_output?.items || [] };
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
  if (body.translate && Array.isArray(body.translate.items)) {
    try {
      const items = body.translate.items.slice(0, 30).map((x) => ({ id: String(x.id), answer: String(x.answer || "").slice(0, 600), origin: String(x.origin || "").slice(0, 300), closest: String(x.closest || "").slice(0, 300) }));
      return res.status(200).json(await translate({ items, to: body.translate.to === "en" ? "en" : "ko" }));
    } catch (err) {
      return res.status(502).json({ error: "Couldn't translate." });
    }
  }
  const post = body.post;
  if (!post || !Array.isArray(post.comments) || !post.comments.length) {
    return res.status(400).json({ error: "No comments to read." });
  }
  const known = Array.isArray(body.known) ? body.known.map(String).slice(0, 300) : [];
  try {
    const asked = typeof body.asked === "string" ? body.asked.slice(0, 160) : "";
    // one chosen phrase is a small job: low effort is fast enough and accurate enough here
    const result = await analyze({ post, country: body.country || null, countries: Array.isArray(body.countries) ? body.countries : null, known, explainIn: body.explainIn || "en", asked }, asked ? { effort: "low" } : {});
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "AI is busy. Try again soon." });
    if (err instanceof Anthropic.AuthenticationError) return res.status(500).json({ error: "Server key problem." });
    if (err instanceof Anthropic.APIError) return res.status(502).json({ error: `AI error ${err.status}` });
    return res.status(500).json({ error: "Couldn't read this one." });
  }
}
