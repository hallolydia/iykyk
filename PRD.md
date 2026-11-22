# IYKYK: Product Requirements (v0.1)

> If you know, you know. **Now you know.**

IYKYK finds the cultural context you are missing in English comments, explains just enough, and remembers what you already know.

Owner: Lydia Oh · Status: Draft

---

## 1. Problem

I live in the US. I read and hear English every day, and I understand every word. But when everyone laughs at a comment, I often don't. The joke sits on top of memes, old TV shows, sports, and celebrities that people raised here just know.

The real problem: **I don't know what I don't know.** I can't search for context I don't know I'm missing.

Asking ChatGPT works, but copying, switching apps, and writing a question takes long enough that I give up.

## 2. Who it's for

- Primary: an adult raised outside the US, with advanced English, living in or consuming US culture (me first).
- Situation: scrolling Instagram Reels on a PC, reading the comments.

## 3. Goals and non-goals

Goals
- Find the phrases a non-US-raised reader would likely miss, without being asked.
- Explain just enough to get the joke, tone, or reference in this comment.
- Remember what the user already knows, so they see less over time.
- Be honest when unsure.

Non-goals (this version)
- Not an English-study app. No quizzes, no lessons, no streaks.
- No translation or summary. The original comment stays as it is.
- No login, no accounts, no onboarding flow.

## 4. Design principles

1. **Keep the original. Just point to what you might miss.** No translation, no summary. The user still reads it themselves.
2. **Answer the foreigner's real question.** "Why is this funny?", "What's the reference?", "Is this rude or friendly?"
3. **Say "not sure" instead of making things up.** A wrong explanation is worse than none.
4. **Quiet is better than noisy.** Underline only the hinge: the phrase the joke, reference, or tone depends on. Missing one joke is better than underlining everything. Noise kills trust.
5. **Never read who wrote it.** Comment text only. No usernames, no profile photos.
6. **Keep the eyes in one place.** A small mark on the content, the full answer in the panel, and both light up together.

## 5. Core flow

1. Paste comments (web app) or click "Read these comments" (Chrome side panel on Instagram).
2. Loading: "Reading like someone who didn't grow up here..."
3. Comments appear with a few underlines. Banner: "3 things you might miss. 2 hidden because you already know them."
4. Click an underline or "Why is this funny?" to open a card.
5. Card actions: **Got it** ("Now you know.") · **I knew this** (hide next time) · **Still confused**
6. Paste a second post. Fewer underlines, because IYKYK remembers.

First visit easter egg: the logo "IYKYK" itself is underlined. Clicking it opens a card that explains the name. Ends with "Now you know."

## 6. Underlines and cards

### What gets underlined

Underline the hinge: if someone misses it, they misread the whole comment.

| Underline | Skip |
|---|---|
| The punchline: without it, you don't get why it's funny ("Christmas heist") | Words with the same meaning in a dictionary |
| A hidden reference: a show, meme, event, or celebrity | Things that don't change the meaning if you miss them ("Yall") |
| A tone flip: sarcasm, teasing that sounds like praise, rude vs. friendly ("Like real dads, not just fathers") | Emojis and slang that mean the same thing worldwide |

At most 1 to 2 per comment. On a post, focus on the top comments.

### Connecting the content and the panel

Three rules, so the eyes don't bounce back and forth:

1. **Only a mark on the content.** An underline and a small number (①) on the original. Nothing else.
2. **The quote on the card.** Each card starts with the exact phrase, so there's no need to look back.
3. **Both sides light up.** Hover an underline and its card glows. Hover a card and its underline glows.

Two steps:

- **Hover:** a small bubble next to the underline shows the first line only. Zero eye travel.
- **Click:** the full card opens in the panel (origin, closest thing in your country, actions).

By content type:

| Content | On the content | In the panel |
|---|---|---|
| Text (articles, pasted text) | Underline + number | Cards in the same order. Scrolling brings the visible paragraph's cards to the top. |
| Comments (Instagram, Chrome extension) | Underline drawn over Instagram's text (Instagram's code is not changed). "Why is this funny?" button next to top comments. | Cards in the same order as on screen. Clicking a card scrolls Instagram to that comment. |
| Video (Reel scene, on-screen captions) | Nothing on the video | A thumbnail of the scene at the top of the card, with the funny moment circled. On-screen captions are quoted like text. If there's a timestamp (YouTube), a "0:04" chip jumps to it. |

### The card

| Part | Example ("Not the Christmas heist 💀") |
|---|---|
| Question title | Why is this funny? |
| First line, like a friend | Taking someone's gift in a gift-swap game, described like a movie robbery. 💀 means "I'm dying laughing." |
| Where it comes from | One short line on the origin of the phrase |
| Closest thing in Korea | Only when a real match exists. Marked "closest match" |
| Needs checking | Shown when confidence is low |
| Actions | Got it · I knew this · Still confused |

## 7. Requirements

Must
- M1. Paste box with example buttons. Returns underlined comments and cards.
- M2. One AI call returns structured JSON. Every underline quotes the exact original text.
- M3. Code checks each quote exists in the input. Missing quote = dropped.
- M4. Confidence filter: 0.7 or higher shown; 0.4 to 0.7 shown with "Needs checking"; below 0.4 dropped.
- M5. "I knew this" saves the item in the browser and is sent to the AI next time ("this user already knows: ...").
- M6. "Still confused" saves the comment to a review list (count shown). These become future test cases.
- M7. Test set: 20 comments labeled by me. A script scores each prompt version.
- M8. Deployed on the web. API key on the server, basic rate limit, honest fallback when AI fails.

Should (if time is left)
- S1. Chrome side panel on Instagram: reads visible comment text only, plus a screenshot of the current Reel for scene context.
- S2. Select any text, click "Ask IYKYK" for things the AI missed.
- S3. Settings: "I grew up in" (Korea first) and "Explain in" (English / Korean).
- S4. "Now you know" list of everything the user has learned.

Later (mention only)
- Spotting a running joke across replies.
- Reply check: "How will this sound to Americans?" ("Stop lurking. Start replying.")
- Daily recap of saved phrases, like a friend texting you.
- Audio and music understanding.

## 8. AI design

Inputs
- Comment text (no usernames)
- Optional: post caption, Reel screenshot
- User's "grew up in" country
- List of things the user already knows

Underline rule (in the prompt)
> Underline only the hinge: the phrase the joke, reference, or tone depends on. If someone misses it, they misread the whole comment. Underline a phrase only if an adult who grew up in [country], with advanced English, would likely miss the meaning, the joke, or the tone, even though they know every word. Do not underline words with the same meaning in a dictionary, or emojis and slang that mean the same thing worldwide. At most 2 per comment. Quote the exact text. Give a confidence from 0 to 1. If you are not sure what it refers to, say so. Never guess a source.

Output (JSON, per underline)
`quote`, `question_type`, `first_line`, `origin`, `closest_in_country`, `confidence`

Where AI is deliberately not used
- What the user knows: the user tells us with a button. AI does not guess.
- Ground truth: I label the test set by hand. AI does not grade AI.
- What clues the product reads: I decide, based on the comparison test (comment only vs. comment + scene).

## 9. Trust and safety

- Quote check in code (M3)
- Confidence filter (M4)
- Sensitive comments (grief, illness): explain the tone gently. Never joke.
- Recent memes after the AI's training: likely low confidence, shown as "Needs checking"
- Privacy: comment text only, stored in the browser only. "IYKYK only reads the words, never who wrote them."

## 10. How we know it works

Test set: 20 real comments (10 I didn't get, 5 easy, 5 unclear, 1 to 2 sensitive), labeled by me.

| Measure | Target | Why |
|---|---|---|
| Underlines that were right | 80% or more | Most important. Noise kills trust. |
| My gaps that AI found | 60% or more | Missing a few is okay. "Ask IYKYK" covers the rest. |

Track the score for each prompt version (v1, v2, v3) and group the errors by type.

Experiment: the same comment, (a) comment only vs. (b) comment + scene. Decide from the result whether the product must read the scene.

## 11. Voice and UX writing

Tone: a friend who grew up here, explaining over text. Short, warm, a little cheeky. Never a teacher.

| Moment | Copy |
|---|---|
| Tagline | If you know, you know. Now you know. |
| Loading | Reading like someone who didn't grow up here... |
| Nothing found | Nothing to explain. You're basically from here now. |
| Got it | Now you know. |
| I knew this | Look at you. I'll skip this next time. |
| Needs checking | Even I'm not sure about this one. |
| 💀 | Not actual death. Dying of laughter. |
| AI failed | Showing a saved example. Live AI is taking a nap. |
| Privacy | IYKYK only reads the words, never who wrote them. |

Words to avoid: learn, study, lesson, quiz, score.

## 12. Constraints

- Demo must run for real
- Judges speak English. UI is English.
- AI makes mistakes, especially on new memes

## 13. Open questions

- Is 2 underlines per comment the right cap? Decide from the test set.
- Is 0.7 the right confidence line? Decide from the test set.
- Does the scene screenshot clearly improve explanations? Decide from the experiment.
