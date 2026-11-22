# IYKYK: User Journey (v0.1)

The step-by-step behavior of the Chrome extension. One main path, the branches off it, and the rules that hold everywhere.

Related: [PRD](PRD.md) · [Design](DESIGN.md) · [Decisions](decisions.md)

`[ ]` = open question, decide during the build.

---

## 0. Who and where

- **User:** an adult raised outside the US, reading English Instagram Reels comments on a PC.
- **Where IYKYK lives:** Chrome's side panel, next to Instagram. Instagram's page is never changed, only drawn over (highlights).

---

## 1. Install (once)

1. User installs IYKYK from GitHub (load unpacked) or the web store later.
2. A **welcome tab** opens automatically. One screen, three things:
   - a. "Pin IYKYK to your toolbar" with a small picture of where the pin is.
   - b. **"Where did you grow up?"** IYKYK suggests one country from the browser language (e.g. Korean > Korea). The user taps to confirm, picks another, or picks up to 2.
     - If they skip: IYKYK explains for "anyone raised outside the US".
   - c. "Open Instagram and try it" button.
3. Nothing else is asked. No account. Everything is saved in this browser.

> Why ask here: at install, people expect setup. While they read, they don't. (D-new)

---

## 2. Main path: one Reel

1. User opens a Reel on instagram.com and opens the comments.
2. User clicks the IYKYK icon. The side panel opens.
3. Panel shows **"Read these comments"**. User clicks it.
   - [ ] Or start reading automatically when the panel opens? Decide by testing.
4. IYKYK reads:
   - the **comment text that is visible** on screen (no usernames, no profile photos)
   - the Reel's caption, if visible
   - a **screenshot of the current Reel frame**, for scene context (D10)
   - the user's "grew up in" country and the list of things they already know
5. Loading state (1 to 5 seconds): "Reading like someone who didn't grow up here..."
6. **Results appear at once:**
   - Banner: "3 things you might miss. 2 hidden because you already know them."
   - On Instagram: lime highlight + number badge on each flagged phrase.
   - In the panel: **all cards open**, in the same order as on screen. Each shows the question tag, the phrase, and the answer. Details are folded under "More".
   - The first card is in focus.
7. User reads. Any of these:
   - a. **Hover a highlight on Instagram** > its card glows in the panel.
   - b. **Hover a card** > its highlight gets a black outline on Instagram.
   - c. **Click a card whose comment is off screen** > Instagram scrolls to it, the highlight blinks once.
   - d. **↑ / ↓** > move focus between cards.
8. On each card, the user picks one:
   - a. **Got it** (or Space)
     - Toast: "Now you know."
     - Saved to Now you know as "new to you".
     - Focus moves to the next card.
   - b. **I knew this**
     - Toast: "Look at you. I'll skip this next time."
     - Highlight fades out. Banner count goes down.
     - Saved as "known". It will be hidden everywhere from now on.
     - Focus moves to the next card.
   - c. **Still confused**
     - Toast: "Noted. I'll do better on this one."
     - Saved to "Still confused" on the Now you know page, and as a future test case.
     - The card offers: "Explain it another way" (one more try, simpler, with an example).
   - d. **More ▾**
     - Opens "Where it comes from" and "Closest thing in [country]".
9. When all cards are handled: "That's all for this post. Scroll on."

---

## 3. Asking in your own words

The panel has a fixed **ask bar** at the bottom: "Ask about this post..."

1. Above it, 2 to 3 suggested questions based on this post. e.g. "Is comment 3 rude?", "Why is everyone saying heist?"
2. **Select text on Instagram** > the ask bar fills in: Ask about "contact sport".
3. User sends a question.
4. The answer comes back **as a card in the same format** (question tag, phrase, answer, More), added under the others. Not a chat bubble.
5. Same rules as every card: quote the original exactly, say "Needs checking" when unsure, actions Got it / I knew this / Still confused.
6. **Scope:** questions about this post's comments and scene only. Anything else:
   - "I can only help with what's on this post. Try selecting a phrase."

> Why: it's not another chatbot. You can ask, but only about what's in front of you.

---

## 4. The next Reel (the moment)

1. User scrolls to another Reel and opens comments.
2. Panel shows "New comments. Read them?" (or reads automatically, see 2.3).
3. Results: **fewer highlights.** Things the user marked "I knew this" are not flagged.
   - Banner: "1 thing you might miss. 4 hidden because you already know them."
   - A dashed card at the bottom: "4 hidden · you already know them", listing them. Click one to unhide it.
4. If something the user marked "Got it" before shows up again:
   - It is **not** highlighted.
   - It counts as **"Seen again"** on the Now you know page.
   - [ ] Show a tiny "Seen again" note in the panel? Could be a nice moment, could be noise.

---

## 5. Now you know (page)

Opened from "Now you know 12" in the panel header.

1. Left: title, "You're in on 24 inside jokes you didn't get a month ago.", stats (gaps per post 5 > 2, new this week, seen again).
2. Top of the list: filters (All, Jokes, References, Tone) and search.
3. **Still confused** block first. Click one > it opens and explains it another way.
4. Then everything else, by date: phrase, type tag, answer, where it was seen.
   - "Seen again ×3" in lime when it came back.
   - "You knew this" in gray for known items. Undo is available.
5. No quizzes, no streaks, no scores.

---

## 6. Settings (small)

In the panel header menu:
- Grew up in (change anytime, up to 2)
- Explain in: English / Korean
- Marks on page: on / off
- Clear everything saved (with a confirm)

---

## 7. When things go wrong

| Situation | What the user sees |
|---|---|
| No comments visible | "Open the comments first, then click Read." |
| Not an English post | "IYKYK works with English for now." |
| Nothing to flag | "Nothing to decode. You're basically from here now." |
| AI is slow (over 8 seconds) | Keep the loading line, add "Still reading..." |
| AI fails or limit reached | "Showing a saved example. Live AI is taking a nap." (only in the demo page) / "Couldn't read this one. Try again." (extension) |
| Instagram layout changed and comments can't be found | "I can't see the comments on this page. Select some text and Ask instead." |
| Sensitive comment (grief, illness) | Explained gently, never as a joke. No emoji inspection. |

---

## 8. Rules that hold everywhere

1. Read the words, never who wrote them.
2. Highlight only the hinge. At most 2 per comment.
3. Every highlight quotes the original exactly. If the quote isn't in the text, it's dropped.
4. Confidence below 0.4 is dropped. 0.4 to 0.7 shows "Needs checking".
5. The user decides what they know. The AI never guesses it.
6. One witty moment per screen. Never inside the text you read.
7. Everything is stored in this browser only.

---

## 9. The demo page (for judges)

The same panel, on a sample Reel feed inside a normal web page, so judges can click without installing.
- Sample comments are built in. "Try another post" switches to the second post to show it getting quieter.
- Clearly labeled: "Demo with sample comments. Install the extension to use it on Instagram."

---

## 10. Open questions

- [ ] Read automatically when the panel opens, or wait for a click?
- [ ] Show "Seen again" in the panel, or only on the Now you know page?
- [ ] How many suggested questions above the ask bar: 2 or 3?
