# IYKYK: Design

How IYKYK looks, sounds, and behaves. Draft v0.1. Values marked *(proposal)* are starting points, to be tuned during the build.

Related: [README](../README.md) · [PRD](PRD.md)

---

## 1. Feeling

**A friend who grew up here, explaining over text.**

- Easy like a newsletter that makes the news feel light (ref: Newneek)
- Close like a friend's message, not a lesson (ref: Speakable, daily Friends shadowing on KakaoTalk)
- Out of the way like a browser side panel (ref: Chrome side panel)

Three words: **Quiet. Friendly. Cheeky.**

### Concept: Kitsch, but minimal and legible

- Black, white, and gray, plus **one** point color: acid lime, like a highlighter
- Where you read (comments, card text): calm, simple, high contrast
- Small moments (marks, stickers, toasts, the logo): bold and a little kitsch
- Simple overall, with a few spots that pop. It should feel like the name: an inside joke.

### Moodboard takeaways

References: Bolt, Revolut, Cash App, Mastercard, Voxly, Amuse, Flor, Officely, fluz, stiff, and minimal to-do apps.
Goal: **simple, readable, intuitive UI, with a few kitsch moments.**

What we take, and where it goes in IYKYK:

| Pattern in the moodboard | In IYKYK |
|---|---|
| Lots of white space, calm lists (to-do apps, DailyLoop) | The base: comment list and panel stay quiet |
| Big, bold, tightly spaced sans headlines (Revolut, Cash App, Mastercard) | Card question title and banner count ("3 things you might miss") |
| Lime and black only (Bolt) | Our palette: mono + lime |
| Stacked black pill labels (Revolut "Settle the debate", Voxly) | The first screen headline, and the card question title as a black pill |
| Small objects and emoji placed inside a sentence ("My daily (📷)(🎧) setup") | **One** inline sticker per card, where it helps you picture the idea. "Taking a 🎁 in a gift swap, like a movie heist." |
| 3D emoji faces | Tone meter for "Is this rude or friendly?": a face from friendly to rude |
| Big numbers (15k, $1,972) | The count on the banner and in "Now you know (12)" |
| Pills with a small image (music chips) | "Now you know" list: each phrase as a pill |
| Ransom-note mixed type (WaiT! ThinKing...) | Kitsch moments only: loading, empty state, video title card. Never where you read. |

What we leave out: gradient backgrounds, many colors, collage on reading surfaces.

## 2. Principles

1. **The content is the hero.** IYKYK adds marks, never covers the original.
2. **Keep the eyes in one place.** Mark on the content, answer in the panel, linked on hover.
3. **Quiet by default.** Few underlines. Calm colors. Nothing blinks.
4. **Honest states.** "Not sure" and "AI failed" look different from a normal answer.
5. **A smile, not a show.** Wit lives in the copy, not in animations.

### Wit budget

Readable and minimal everywhere. Witty in a few planned spots.

- **One witty moment per screen, at most.** If a screen already has a joke, everything else stays plain.
- **Wit goes where nobody is reading hard:** loading, empty state, toasts, the logo card, button feedback.
- **No jokes where you read:** no witty copy, stickers, or extra emoji inside the comment text or the card's explanation. (The highlight and number marks do belong on the original. They are the product, not decoration.)
- **Wit comes from three tools only:** the copy, the lime sticker, and one inline emoji per card.
- **The test:** remove the joke. If the screen gets harder to use, the joke was doing a job. If nothing changes, it's decoration. Keep it light.

## 3. Layout

### Web app (paste)

```
┌──────────────────────────────────────────────┬────────────────────┐
│  IYKYK  (logo, underlined on first visit)     │  What I know (12)  │
├──────────────────────────────────────────────┼────────────────────┤
│  Banner: 3 things you might miss.             │                    │
│          2 hidden because you already know.   │   Card panel       │
│                                               │   (~400px)         │
│  Comment                                      │                    │
│  Not the [Christmas heist]① 💀                │   ① Christmas heist│
│                                               │   Why is this      │
│  Comment                                      │   funny?           │
│  Like [real dads, not just fathers]②          │   ...              │
└──────────────────────────────────────────────┴────────────────────┘
```

### Chrome side panel (Instagram)

- Instagram stays on the left, untouched. IYKYK lives in Chrome's side panel on the right.
- Top of the panel: **Read these comments** button
- Cards follow the order of comments on screen.

## 4. Components

### Underline mark
- Lime highlight behind the phrase, black text on top
- Number badge at the **top-left** of the highlight, half over its corner: a small lime circle with a black outline and a black number. You see the number first, then read the phrase, and it doesn't push the line wider.
- Give lines enough height so the badge never covers the line above.
- States
  - Default: lime highlight
  - Hover / linked: soft highlight behind the phrase
  - Needs checking: dashed underline
  - Known (hidden): no mark

### Hover bubble
- Appears next to the underline on hover
- Shows the **first line only**. Max 2 lines.
- Footer hint: "Click for the full story"

### Panel and cards (in the panel)

Panel header: "3 things in this post" + "1 of 3 ‹ ›".

**Open card** (soft white card, 22px radius, light shadow, a faint lime wash at the top). Order, top to bottom:
1. Number badge + **question tag** (small gray pill: Why is this funny? / What's the reference? / Is this rude or friendly?). The question is a label, not a headline.
2. **The phrase** ("Christmas heist"): the biggest thing in the card. This is what the user is looking for.
3. **The answer**, like a friend. One or two lines, with one inline emoji.
4. Emoji under inspection *(only if an emoji carries meaning)*, in a light gray inset box
5. Details as quiet rows with mono labels and hairline dividers: Where it comes from · Closest thing in [country] (tagged "closest match")
6. Scene thumbnail *(video only)*, with the funny moment circled
7. Actions: **Got it** (black) · I knew this (gray) · Still confused (text link). One strong button only.

**All cards open by default.** Every card in the post shows its tag, phrase, and answer right away, so the user reads all of them with one scroll and zero clicks. Only the details (where it comes from, closest in your country) fold under "More ▾". The card in focus gets a thin black outline and the lime wash; the others stay plain white.

**Fast moves**
- "Got it" or "I knew this" moves focus to the next card automatically.
- Keyboard: ↑ ↓ to move between cards, Space for Got it.
- How people find out, quietly: keycaps next to the panel title ("↑ ↓ to move") and inside the Got it button ("space"). If someone clicks Got it with the mouse a few times in a row, a one-time toast says "Tip: press Space next time." No onboarding screen.

**The card gradient sits behind everything** (z-index below the content) and fades out by about the middle of the card, so the lower half stays clean white.

**Other cards** are not folded into one-line rows. Each one is a small white card showing the number, the phrase, the question type on the right, and a one-line preview of the answer, so the user can scan what's coming.
**Needs checking** shows as a soft amber tag on the card, not an alarm.

### Buttons
- Primary: Got it
- Secondary: I knew this, Still confused
- Inline: "Why is this funny?" next to top comments (small, pill-shaped)

### Toast
- Bottom of the panel, 2 seconds
- "Now you know." / "Look at you. I'll skip this next time."

### Banner
- One line count + hidden count. Calm, not alarming.

### What I know (drawer)
- List of known and saved phrases, each with Undo
- Footer: "Saved in this browser only. No account."

## 5. Linking behavior

| Action | On the content | In the panel |
|---|---|---|
| Hover an underline | Soft highlight + hover bubble | Same card glows |
| Hover a card | Same underline glows | Card glows |
| Click an underline | Highlight stays | Full card opens, scrolls into view |
| Click a card | Content scrolls to the phrase | Card opens |
| I knew this | Underline fades out | Card collapses, count goes down |

### In the Chrome extension (Instagram)

Goal: the user always knows where a card points to on the page, without the page looking different.

1. **Light marks on the page.** Highlight + number are drawn over Instagram's text. Font, spacing, and layout stay exactly the same.
2. **Same order, same number.** Card order follows the order on screen. Mark ② on the page = card ② in the panel.
3. **Point both ways.** Hover a card and its mark on the page gets a black outline. Hover a mark and its card glows.
4. **Off screen.** If the comment isn't visible, the card shows "↑ above" or "↓ below". Click the card: Instagram scrolls to it and the highlight blinks once.
5. **Follow the scroll.** As the user scrolls Instagram, cards for the visible comments move to the top of the panel.
6. **Marks on page: on / off.** A switch at the top of the panel, for a clean page when wanted.

## 6. Visual tokens

Light first. A light gray page instead of pure white, for less glare and easier reading. Dark mode comes later, as an option.

| Token | Value *(proposal)* | Use |
|---|---|---|
| `--paper` | #F4F4F4 | Page background, light neutral gray. White cards sit on it, and the lime pops more. |
| `--surface` | #FFFFFF | Cards, panel |
| `--ink` | #111111 | Main text, thick outlines |
| `--sub` | #5E5E5E | Secondary text |
| `--line` | #E4E4E0 | Hairline borders |
| `--lime` | #D4FF3A | The one point color: marks, number badges, stickers, logo |
| `--lime-soft` | lighter lime | Linked glow on hover |
| `--check` | amber | Needs checking (dashed underline) |

**Legibility rule: lime is never a text color.** It only sits behind black text, like a highlighter.

- One point color only. Type differences (Joke / Reference / Tone) are shown by the card's question title, not by extra colors.
- Type: see **6c. Type scale**. Content inside the extension keeps the site's own font.
- Kitsch details: 1.5px black outlines on stickers and badges, a slight tilt on the "Now you know." sticker.
- Radius: soft (14 to 22px for cards, pills for chips). Shadows: very light, on cards and the hover bubble. No thick black borders on cards.
- **Gradients are allowed when they stay soft and on-concept:** the highlighter keeps crisp edges and fades slightly from left (full lime) to right (lighter lime); the open card has a long, faint lime wash from the top. Number badges stay flat, no gradient. No colorful background gradients.
- **Strength budget:** black is for the one primary button and the text. Everything else (tags, cards, secondary buttons) stays light, so the eye goes to the phrase and the answer first.
- Motion: fade and glow only, 150 to 200ms. One exception: the "Now you know." sticker pops in.

## 6b. Logo *(decided)*

References: chunky rounded wordmarks (fluz, PayPal), Y2K type with a sparkle (stiff), lime and black icons.

- **Wordmark:** lowercase `iykyk` in a chunky, rounded, bouncy display font (Bagel Fat One for now), tight letter spacing
- **Symbol: the footnote asterisk.** Three rounded bars, lime fill, black outline. An asterisk is a footnote mark: "there's a backstory here." That is exactly what IYKYK adds.
- **Main logo:** wordmark + the footnote asterisk at the top right of the last k, small and close, sitting a little above the letter (like a footnote mark), not touching it
- **App and extension icon:** the asterisk only, centered and large, black on lime (or lime on black)
- **Where the asterisk appears:** logo, icon, and special moments only (first-visit logo card). Not on every mark in the content, so it stays special.
- First visit: the logo itself is highlighted. Click it and it explains its own name.

**Brand sticker rule:** lime fill + black outline. The asterisk, the number badges, and the "Now you know." sticker all follow it.

## 6c. Type scale

Seven sizes, no in-betweens. Every step has one job. If two things need to look different, they move at least one full step apart, or they differ in weight or color, never by 1px.

Body text uses tracking -0.006em (Inter reads a bit loose by default). Reading text keeps generous line height: 1.55 to 1.6, comments 1.9 to leave room for the number badges.

Two families:
- **Inter Tight** (800 / 700): loud moments. Big, heavy, tight.
- **Inter** (400 / 500 / 600): everything you read and click.
- **IBM Plex Mono** (500): small section labels only. A typewriter touch, like a price tag (ref: Cash App).

| Token | Size / line height | Font | Tracking | Job |
|---|---|---|---|---|
| `display` | 64 / 1.0 | Inter Tight 800 | -0.045em | The one loud thing per screen: home headline pills, the banner number |
| `title` | 28 / 1.15 | Inter Tight 700 | -0.025em | The phrase on the open card ("Christmas heist") |
| `subtitle` | 24 / 1.2 | Inter Tight 700 | -0.02em | Banner sentence ("things you might miss.") |
| `read` | 20 / 1.6 (comments 1.9) | Inter 400, 500 for the answer | 0 | What you read: comment text, the card's first line, input text |
| `ui` | 15 / 1.5 | Inter 400 / 600 | 0 | Card sections, hover bubble, buttons, pills, list rows |
| `meta` | 13 / 1.4 | Inter 400 | 0 | Secondary info: "Comment 2", likes, "1 of 3", source |
| `label` | 12 / 1.3 | IBM Plex Mono 500, uppercase | +0.06em | Section labels: WHERE IT COMES FROM, CLOSEST MATCH |

Three levels of color, used on top of size:
- `--ink` #111: what matters
- `--sub` #5E5E5E: supporting text
- `--muted` #9A9A95: placeholders and meta you can skip

Rules
- **The answer wins inside the card.** The phrase is `title`, the answer is 18 / 1.55. Everything under it is `ui`. The question type is a small tag. One glance gives you the point.
- **The comment is the biggest reading text on the page.** The panel never shouts louder than the content it explains, except the phrase on the open card.
- **Heavy only in Inter Tight.** Inter stays 600 or lighter, so the loud moments stay rare.
- **Never below 12px.** Number badges are the only exception (11px inside a 19px circle).

## 6d. Signature moments (from the moodboard)

Three kitsch ideas we keep. Each one also does a job.

1. **Pill + icon circle** (ref: Revolut). A black headline pill followed by a black circle with the lime asterisk. Where: home headline, video title card.
2. **Stickers on things** (ref: Cash App price tags). IYKYK literally sticks small lime tags on comments. Where: pitch video opening, empty state illustration (a comment bubble with lime tags). Plus mono labels on cards. Never a collage behind text you read.
3. **Emoji under inspection** (ref: emoji being edited in a design tool). When an emoji carries the meaning, the card shows it inside a dashed selection box with corner handles, next to its real meaning: 💀 "Not actual death. It means I'm dying laughing." Also: the tone meter for "Is this rude or friendly?" uses 3D faces, and the loading screen moves a selection box across emoji ("Decoding...").
   - Emoji art: Microsoft Fluent 3D Emoji (MIT license). Not Apple emoji images (not licensed for this).

## 6e. Panel scale (the 400px extension panel)

The desktop scale is too loud next to Instagram. Instagram's comment text is about 14px, so the panel stays **one step quieter than the post it explains**: the content is the hero, the panel is the footnote.

| Role | Size / line height | Font |
|---|---|---|
| Banner number | 34 / 1.0 | Inter Tight 800, -0.04em |
| Card phrase | 18 / 1.25 | Inter Tight 700, -0.015em |
| Banner sentence | 16 / 1.25 | Inter Tight 700 |
| Answer | 14 / 1.55 | Inter 400, #2A2A2A |
| UI (buttons, chips, links) | 12.5 to 13 | Inter 500 |
| Meta (hints, sub lines) | 12 | Inter 400, --sub |
| Labels | 10.5 | IBM Plex Mono, uppercase |

- Spacing on a 4px grid, with clear air between levels: tag > phrase 12, phrase > answer 8, answer > emoji box / More 14, More > details 14, between details 14 (hairline in the middle), label > text 6, last block > actions 16, card padding 18, card gap 8.
- Buttons 34px tall. Chips 28 to 32px.
- One banner line ("4 things you might miss.") with the ↑ ↓ hint on the right. No second title saying the same thing.
- Only the focused card shows its actions and "Still confused". Other cards show tag, phrase, answer.
- Hierarchy comes from weight and color, not from size.

## 7. Voice and UX writing

Tone: short, warm, a little cheeky. A friend, never a teacher.

| Moment | Copy |
|---|---|
| Tagline | If you know, you know. Now you know. |
| Logo card (first visit) | IYKYK = If you know, you know. An inside-joke phrase. Now you know. |
| Loading | Reading like someone who didn't grow up here... |
| Nothing found | Nothing to explain. You're basically from here now. |
| Got it | Now you know. |
| I knew this | Look at you. I'll skip this next time. |
| Still confused | Noted. I'll do better on this one. |
| Needs checking | Even I'm not sure about this one. |
| 💀 | Not actual death. Dying of laughter. |
| AI failed | Showing a saved example. Live AI is taking a nap. |
| Privacy | IYKYK only reads the words, never who wrote them. |

Words to avoid: learn, study, lesson, quiz, score, wrong.

## 8. Accessibility

- Underlines never rely on color alone: number badge + dashed style for "Needs checking"
- Hover bubble also opens on keyboard focus
- Text contrast meets WCAG AA in light and dark
- Every card action reachable by keyboard

## 9. Open design questions

- Hover bubble: helpful, or too much on a busy comment section?
- How much of the scene thumbnail is enough on a card?
