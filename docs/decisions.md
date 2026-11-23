# IYKYK: Decision Log

Every product call I made, what I considered, and why. ★ = worth telling in the pitch.

Related: [README](../README.md) · [PRD](PRD.md) · [Design](DESIGN.md)

Status: **Decided** · **To test** (the build or test set will settle it)

---

## Index

| # | Decision | Status |
|---|---|---|
| D1 | Solve context, not language | Decided ★ |
| D2 | Start with Instagram comments on PC | Decided |
| D3 | AI finds the gaps first. You don't have to ask. | Decided ★ |
| D4 | Keep the original. Just point. | Decided |
| D5 | Underline only the hinge | To test ★ |
| D6 | Explain through a foreigner's questions | Decided |
| D7 | Keep the eyes in one place | Decided ★ |
| D8 | Three ways to ask, from one click to free text | Decided |
| D9 | Bridge to your home culture | Decided |
| D10 | Read the scene, not just the comment | To test ★ |
| D11 | Rules in the prompt, filters in code, proof in a test set | Decided ★ |
| D12 | Where AI is deliberately not used | Decided ★ |
| D13 | Remember what you know, and tell the AI | Decided |
| D14 | "Still confused" improves the AI, not the user | Decided |
| D15 | Handle sensitive comments, don't hide them | Decided |
| D16 | Read the words, never who wrote them | Decided |
| D17 | Side panel, not inside Instagram | Decided |
| D18 | Paste first, extension second | Decided |
| D19 | English UI, explanation language as a setting | Decided |
| D20 | Not an English-study app | Decided |
| D21 | What waits for later | Decided |
| D22 | Name: IYKYK | Decided |
| D23 | Calibrate the AI with evidence, not a survey | Decided ★ |
| D24 | Speed vs. accuracy: measure before trading | Decided ★ |
| D25 | Sound: the track name now, speech later | Decided |
| D26 | More comments, more cards, but one card per meme | Decided |
| D27 | English comments only; skip other languages | Decided ★ |
| D28 | Instagram, YouTube, Reddit and articles, without watching every site | Decided |

---

## D1. Solve context, not language ★

- **Problem:** I understand every word in a comment and still don't get the joke.
- **Considered:** translation, vocabulary help, cultural context
- **Chose:** cultural context
- **Why:** Translation turns words into other words. The missing piece is the meme, show, event, or tone the joke sits on.

## D2. Start with Instagram comments on PC

- **Considered:** news articles, Reddit, YouTube, Instagram; mobile vs. PC
- **Chose:** Instagram Reels comments, on PC
- **Why:** It's where I hit this problem every day. PC lets a Chrome side panel sit next to the comments. Other sources work by pasting text, shown only briefly.

## D3. AI finds the gaps first ★

- **Considered:** a chatbot you ask, a tool that marks gaps for you
- **Chose:** IYKYK marks the gaps without being asked
- **Why:** The core problem is not knowing what you don't know. You can't ask about something you didn't notice. Switching to ChatGPT takes long enough that I give up.

## D4. Keep the original. Just point.

- **Considered:** translate, summarize, mark
- **Chose:** mark only
- **Why:** Covering the original takes away the reading. The user should still read it, and pick up the phrase along the way.

## D5. Underline only the hinge ★

- **Rule:** Underline the phrase the joke, reference, or tone depends on. If someone misses it, they misread the whole comment. At most 1 to 2 per comment.
- **Skip:** dictionary words, things that don't change the meaning ("Yall"), worldwide emojis and slang
- **Why:** Missing one joke is better than underlining everything. Noise kills trust.
- **To test:** Is the cap of 2 right? Is a confidence line of 0.7 right? Decide from the test set.

## D6. Explain through a foreigner's questions

- **Chose:** cards titled "Why is this funny?", "What's the reference?", "Is this rude or friendly?"
- **Why:** What trips a foreigner up is tone and background, not the dictionary meaning.
- **Card order:** first line like a friend > where it comes from > closest thing at home > needs checking > actions

## D7. Keep the eyes in one place ★

- **Problem:** A side panel makes the eyes bounce between content and explanation.
- **Chose:**
  - Only a mark on the content (underline + ①)
  - The exact quote at the top of the card, so no need to look back
  - Hover links both sides
  - Two steps: hover shows the first line right there, click opens the full card
- **Why:** The fastest answer should cost zero eye travel. The full story is one click away.

## D8. Three ways to ask

- **Considered:** paste into a chat, click, drag + right-click menu
- **Chose:**
  1. Default: the AI underlines, plus a "Why is this funny?" button on top comments
  2. Missed something: select text, click "Ask IYKYK"
  3. Still lost: ask in your own words inside the card
- **Why:** One click covers most cases. Free text is the last resort, not the start.

## D9. Bridge to your home culture

- **Chose:** a "Closest thing in [country]" line, only when a real match exists, tagged "closest match"
- **Example:** Karen ≈ 진상 손님 (a customer who asks for the manager)
- **Why:** The fastest way to get something new is to hook it onto something you already know. Marking it "closest match" keeps it honest, since cultures never map 1:1.
- **Needs:** a "I grew up in" setting

## D10. Read the scene, not just the comment ★

- **Question:** Is the comment alone enough to explain the joke?
- **Experiment:** "Not the Christmas heist 💀", (a) comment only vs. (b) comment + a screenshot of the Reel
- **Expected:** (a) explains the word "heist." (b) explains why this moment is funny: stealing a gift in a gift-swap game, called a robbery.
- **Decision rule:** If (b) is clearly better, the extension sends a screenshot with the comments.
- **Scope:** images yes (Claude can read them). Audio and music no, for now. YouTube via pasted transcript.
- **Result:** [TODO]

## D11. Rules in the prompt, filters in code, proof in a test set ★

- **Problem:** I can't ask the AI to be 80% accurate. It can't measure itself.
- **Chose:**
  - **Prompt:** defines what counts as a gap (D5)
  - **Code:** checks each underline quotes the original exactly, drops what doesn't match; filters by confidence (0.7+ shown, 0.4 to 0.7 "Needs checking", below 0.4 dropped)
  - **Test set:** 20 comments I labeled by hand; score every prompt version
- **Targets:** 80%+ of underlines right (most important), 60%+ of my gaps found
- **Line for the pitch:** "I don't ask the AI to be honest. I check it."

## D12. Where AI is deliberately not used ★

| Not AI | Why |
|---|---|
| What the user knows | The user knows best. A button, not a guess. |
| Labeling the test set | AI shouldn't grade AI. Same blind spots. |
| What clues the product reads | My call, based on the D10 experiment |

## D13. Remember what you know, and tell the AI

- **Chose:** "I knew this" hides it next time, and the known list is sent with the next request
- **Why:** Hiding only changes the screen. Telling the AI changes the explanation itself. It's personal without login or training a model. Competitors (Contxt, Unpack) don't track what you know.

## D14. "Still confused" improves the AI, not the user

- **Chose:** "Still confused" saves the comment as a future test case
- **Why:** It's a signal that the explanation fell short. The product learns where it's weak. It is not homework for the user.

## D15. Handle sensitive comments, don't hide them

- **Considered:** filtering out sad or personal comments
- **Chose:** keep them in the product; explain tone gently; never joke. Include 1 to 2 in the test set. Keep them out of the demo video.
- **Why:** "Is this rude or friendly?" matters most exactly there. Hiding them would fail the user when it counts.

## D16. Read the words, never who wrote them

- **Chose:** the extension reads comment text only. No usernames, no photos. Known list stays in the browser.
- **Why:** Those people never agreed to be part of this. It also turns blurring in the demo into a product decision, not an edit.

## D17. Side panel, not inside Instagram

- **Considered:** injecting underlines into Instagram's page, a separate panel
- **Chose:** Chrome side panel. Underlines are drawn over Instagram's text (CSS Highlight) without changing its code, if time allows.
- **Why:** Instagram's code changes often and re-renders. Changing it breaks easily. A panel next to it stays stable.
- **Update (v0.2):** Moved from Chrome's side panel to a panel floating over the right edge of the page (an extension page inside a frame). Chrome's side panel adds its own header with the name again, so the logo showed twice. The floating panel shows one clean header and a close button. Instagram's own page is still never changed.

## D18. Paste first, extension second

- **Chose:** build the paste web app first, then the extension using the same AI
- **Why:** The paste app proves the core works on any text. The extension is the real-world moment, but it depends on Instagram. If it breaks, the core still stands.

## D19. English UI, explanation language as a setting

- **Chose:** UI in English. "Explain in: English / Korean" setting. Demo in English.
- **Why:** The audience for this version speaks English. Some users understand faster in their first language.

## D20. Not an English-study app

- **Chose:** no quizzes, lessons, streaks, or scores. Avoid the words learn, study, lesson, quiz.
- **Why:** The goal is to belong in the conversation, not to pass a test. Picking up the phrase is a side effect.

## D21. What waits for later

| Later | Why not now |
|---|---|
| Spotting a running joke across replies | Fun, but needs the core to be reliable first |
| "How will this sound?" reply check | Biggest next step: from understanding to joining. Needs D5 to work first. |
| Daily recap, like a friend texting you | A habit feature. Proves value only after people use it. |
| Audio and music | Needs a separate speech model |
| Business model | First prove that people reach for it on their own |

## D22. Name: IYKYK

- **Considered:** Backstory, Inside Joke, Wait What?, Lost in Comments
- **Chose:** IYKYK ("If you know, you know"). Tagline and key moment: "Now you know."
- **Why:** The name is itself an inside-joke phrase. A foreigner may not know it, which is the point. On first visit, the logo is underlined and explains itself.

## D23. Calibrate the AI with evidence, not a survey ★

- **Problem:** The AI guesses what "an adult raised in Korea with advanced English" would miss. That's an average person, not this user. In testing it missed the real hinge of a joke ("Hallmark") that I, the user, could spot right away.
- **Options considered:**
  1. Ask job, age, background. Weak link to what someone knows, feels like a survey, and it's personal data.
  2. Ask "How well do you know US culture? High / Low." People can't rate this. That's the core problem: you don't know what you don't know.
  3. Ask nothing, guess only. Fastest, but the first posts are noisy for everyone.
  4. **One required tap (where you grew up) + an optional 10-second check: tap the things you already know.**
- **Chose:** 4, then keep learning from behavior.
  - Where you grew up sets the baseline (what's likely new).
  - The quick check is a real signal, not a self-rating. What you tap goes straight into "already known", so the very first post is quieter.
  - After that, every "I knew this" corrects the AI, and "Still confused" shows where it explains badly.
  - Dropped "years in the US": the quick check gives the same information more directly, with one fewer question.
- **Why:** The AI is good at the average, the user is the only source of truth about themselves. So the AI guesses, the user corrects it with one tap, and the test set measures how often the guess is right.
- **Line for the pitch:** "I don't ask how good your English is. I ask what you already know, and I check it in 10 seconds."
- **Update:** The optional "tap what you already know" step is removed from the first run. The "I knew this" button on each card does the same job where it matters, and the first run is now just one tap (where you grew up).

## D24. Speed vs. accuracy: measure before trading ★

- **Problem:** Reading a post took about 12 seconds at medium effort. Switching posts felt slow.
- **Measured (same post):** medium 11.6s, found the main joke ("Christmas heist"). Low 6.1s, **missed the main joke**. Fast mode: not available on this account.
- **Chose:** keep medium for now, and cut the wait people feel: cache each post (going back is instant), shorter pause between frames, read the post as soon as it opens. The final effort level is decided on the test set, not on feel.
- **Line for the pitch:** "Low effort was twice as fast but missed the main joke. I measured before trading accuracy for speed."

## D25. Sound: the track name now, speech later

- Instagram shows the track as text (e.g. "JADE · Angel Of My Dreams", or "original audio"). It goes to the AI with a rule: think about what that sound is known for (sad violin, suspense, a meme melody). The melody is often the joke, not the lyrics.
- Two frames, half a second apart, show a bit of expression and action.
- Speech (what people say) needs recording the tab's audio and a separate speech-to-text service. Not in this version. YouTube is the easier next step: it has captions as text.

## D26. More comments, more cards, but one card per meme

- Scrolling the comments reads only the newly visible ones and adds cards under the existing ones. No total limit; still at most 2 per comment.
- If the same phrase shows up in many comments (💀 ten times), it's one card ("In 10 comments"), highlighted everywhere. Many memes means more help, but the panel stays quiet.

## D27. English comments only; skip other languages ★

- **Problem:** Instagram posts also carry Korean, Arabic and other comments. Should IYKYK explain those too?
- **Considered:** explain every language; explain only the reader's own language; leave non-English comments alone.
- **Chose:** leave them alone. Comments that are mostly another script are not sent to the AI. "What I read" says how many were skipped.
- **Why:** The promise is the US cultural context hidden in English comments. A Korean reader already knows Korean memes. An explanation of an Arabic joke I can't check is worse than none, and the test set only covers English. It also makes reading faster and cheaper.
- **Line for the pitch:** "I skip comments that aren't in English on purpose. A wrong explanation is worse than none."
- **Related:** D19 (explanation language is a setting). The `EN | 한` switch changes the language of the explanation, not which comments get read.

## D28. Instagram, YouTube, Reddit and articles, without watching every site

- **Problem:** The same missing context shows up in YouTube comments, Reddit threads and news articles, not only Instagram. D2 started with Instagram only.
- **Chose:** the icon works on any https page. Instagram keeps its always-on reader. On every other site the reader is added only when you click the icon, and only on that tab. YouTube and Reddit comments are read with their own selectors; on an article page the visible paragraphs are read. Select-to-ask works on any text.
- **Why:** Asking for permission to read every site you visit is a lot to ask. Clicking the icon is a clear yes from the person, for one page at a time.
- **Known limit:** the page layout tricks (sliding the post card, pointing at the comment icon) are Instagram only. Other sites just get a narrower page beside the panel.

