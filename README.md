# IYKYK

**If you know, you know. Now you know.**

IYKYK finds the cultural context you're missing in English comments, explains just enough, and remembers what you already know.

[Live demo](https://iykyk-eta.vercel.app) · [Pitch video](#) · [PRD](docs/PRD.md) · [Design](docs/DESIGN.md) · [Decisions](docs/decisions.md)

<!-- TODO: hero screenshot or GIF -->

---

## Repo map

```
extension/   Chrome extension (the real product: reads the page, shows the panel)
api/         The AI server: finds the hinge of each comment, translates cards
app/         The live demo page (works without installing anything)
eval/        My hand-labeled test set (comments.txt), the scorer, and the results
docs/        Thinking behind it: PRD, design, user journey, decisions, build log
docs/mockups/  Design iterations before the build
```

## Why I built this

I live in the US. I understand every word in the comments. I still don't get the joke.

The jokes sit on top of memes, old TV shows, sports, and celebrities that people raised here just know. The problem isn't English. It's context, and **you can't search for something you don't know you're missing.**

I could ask ChatGPT. But by the time I copy the comment, switch apps, and write a question, I've already scrolled past.

It isn't only vocabulary. I didn't grow up with the history, the politics, or the TV that people here share, and the sense of humor is different too. So I often can't tell where the joke is, and I can't ask someone "why is this funny?" every single time.

On a Gilmore Girls post I read this comment: "Rory and..Logan?" "Rory and Logan!" "Rory and NOT LOGAN?" EXACTLY THE ROLLERCOASTER I WILL NOT GET OVER. I understood only the last sentence. I didn't know the show, so I didn't know what I was missing, and the only way to find out was to leave the page and ask someone. That is the moment I built this for.

## How it works

1. **Find.** IYKYK underlines the phrases someone raised outside the US would likely miss. You don't have to ask. It works on Instagram, YouTube, Reddit and article pages.
2. **Explain.** One click opens a card that answers the question you'd actually have: *Why is this funny? What's the reference? Is this rude or friendly?*
3. **Remember.** Tap *I knew this* and it stays hidden next time. The more you use it, the quieter it gets.

**Languages in this version:** explanations are in English, with a switch to Korean (EN | 한). You can pick any country you grew up in, and the AI uses it to decide what you are likely to miss, but Korean is the only language besides English that the explanations can be written in.

## Design decisions

| Decision | Why |
|---|---|
| Keep the original. Just point to what you might miss. | No translation, no summary. The goal is to help you read it yourself, not read it for you. |
| Explain through a foreigner's questions. | What trips you up isn't the dictionary meaning. It's tone and background. |
| Say "not sure" instead of guessing. | A wrong explanation is worse than none. You'd join the conversation with the wrong idea. |
| Underline only the hinge. | The phrase the joke, reference, or tone depends on. Miss a few rather than underline everything. Noise kills trust. |
| Keep the eyes in one place. | A small mark on the content, the quote on the card, and both light up on hover. A hover shows the first line right there. A click opens the full card. |
| Read the words, never who wrote them. | Comment text only. No usernames, no profile photos. |

## Making the AI trustworthy

I can't ask an AI to be 80% accurate. So I split the job:

- **The prompt** defines what counts as a gap.
- **The code** checks every underline quotes the original text exactly, and filters by confidence.
- **My own test set** measures whether it actually works.

### Test set

27 comments, labeled by hand: 8 I didn't get, 13 half got, 5 easy, 1 sensitive (a grief comment, to check the tone).
**One correction, made after I saw the results:** three comments I had first marked "easy" ("Sure, Jan.", "the dog days of summer", "Not you guys waiting in the train") were ones the AI underlined. When I looked again I did not actually know them, so I relabeled them. This is why every version scores higher below than in my first scoring (v3 was 68% right at first). The relabel is noted in each comment in `eval/comments.txt`.
14 are real Instagram comments, 2 are sentences from news articles, and 11 are short examples I wrote with Claude to cover sports, politics, money and sarcasm. Those 11 are marked `SYNTHETIC` in [`eval/comments.txt`](eval/comments.txt), and I labeled them myself like the rest.

How it is scored ([`eval/score.mjs`](eval/score.mjs), results in [`eval/results.md`](eval/results.md)):
- **Underline is right** when the AI's quote overlaps a phrase I marked as a gap in that comment.
- **My gap found** when one of my gaps overlaps something the AI underlined.
- The sensitive comment is left out of the numbers and read by eye.

| Prompt version | Underlines that were right | My gaps it found | What changed |
|---|---|---|---|
| v1 | 74% (17 of 23) | 69% (18 of 26) | First prompt: what counts as a gap, how to explain it |
| v2 | 77% (17 of 22) | 69% (18 of 26) | General rules: brand, channel and show names can be the hinge; punchlines sit at the end of long comments |
| v3 | 82% (18 of 22) | 69% (18 of 26) | Added the sound and video frames as input, and several home countries |
| v4 (Opus) | 82% (18 of 22) | 77% (20 of 26) | One test for every phrase: would the reader miss the joke, tone or point without it? Skip, trivia, or needs context |
| v4 (Sonnet, live) | 77% (17 of 22) | 73% (19 of 26) | Same prompt as v4, on the model the live product uses |

Targets: 80% or more of underlines right (most important), 60% or more of my gaps found.
**Where it stands:** after the relabel, v3 and v4 (Opus) meet both targets, and every version meets the gaps target. The live product runs v4 on Sonnet, which is at 77% right, just under the 80% target.

Read this table with care. This test sends only the comment text, so v3's new inputs (sound, frames) were not used. With 27 comments and one run each, a few points between versions is noise, not progress. The honest result is that the prompts are close on this set. v4 finds a few more of my gaps, but one or two comments is within noise.

**What v3 still got wrong (after the relabel):**
- **4 wrong underlines.** Three were comments I had labeled easy: "seconds", "401(k)", "Love that for you." The fourth was "we make some fire Mac n cheese".
- **8 missed gaps.** "freeway", "manchild", "take it back", "misogynistic cliché", "bond investors", "saving it", and two in the comment about a TV couple ("Rory and..Logan?"). These are mostly plain vocabulary and finance words, plus fan-talk that needs knowing the show.
- **The grief comment got no underline and no joke**, which is the behavior I wanted.

### Comment only vs. comment + scene

Same 27 comments, with and without a one-line description of the scene (text only, no images).

| Input | Underlines that were right | My gaps it found |
|---|---|---|
| Comment only (v3) | 82% | 69% |
| Comment + scene text (v3) | 74% | 69% |

What I decided: I'm not claiming the scene helps, because this test did not show it. The live product still sends two video frames and the sound name, since they cost little and sometimes carry the joke, but that was not part of this test and I have no number for it yet.

## Where AI came in, and where it didn't

**Used AI**
- Building the app with Claude Code
- Inside the product: finding gaps and writing cards
- Stress-testing the explanations to find where they break

**Deliberately didn't**
- Deciding what you know. You tell it with a button.
- Labeling the test set. AI shouldn't grade AI.
- Choosing what clues the product reads. That came from the experiment above.

### Which AI does which job, and why

I did not use one big model for everything. Each job got the model and effort it needs, and I measured before trading accuracy for speed.

| Job | Model | Why |
|---|---|---|
| Read a post and find the gaps | Claude Sonnet, medium effort | Low effort was twice as fast but missed the main joke in my test, so I kept medium (D24). The scores above were measured with Claude Opus; I moved the live product to Sonnet to keep each read cheap |
| Explain one phrase you select | Same model, low effort | One chosen phrase is a small job, so it comes back in a few seconds |
| Switch the explanation to Korean or back | Claude Haiku, one small call per card, all at once | It is only rewriting text, so a small model is enough. Cards translate in parallel, and one that fails is asked for again |
| Score the prompts | A script I wrote, against my own labels | AI should not grade AI |

What I did around the model, so I could trust it:
- **Checks in code, not in the prompt.** Every underline must quote the comment exactly. Low-confidence answers are dropped, and in-between ones say "Needs checking".
- **A test before the prompt.** I labeled the answers myself, then scored three prompt versions. I report the result even where I missed my own target.
- **A log of what broke.** [`docs/challenges.txt`](docs/challenges.txt) has every real problem and the fix, including ones where the AI was wrong and I caught it.
- **Rules about where AI should stay out.** It does not decide what I already know (a button does), and it does not touch a grief comment with a joke.

## Challenges I hit

- **The AI underlined the wrong half of a joke.** On "Not the Christmas heist", it flagged "Not the" (a slang pattern) and skipped "Christmas heist", the actual hinge. Both were real gaps, but the joke lives in one of them. I decided which one is the hinge in the test set and the prompt, instead of letting the AI guess.
- **The AI missed the punchline of a long comment.** It flagged "the doctor said it was a false alarm" and missed "Hallmark", the brand the whole parody depends on. Prompt v2 added general rules (brand, channel, and show names can be hinges; punchlines sit at the end of long comments) without naming any test answer, so the score stays honest.
- **Faster was not better.** Medium effort took about 12 seconds per post. Low effort took 6 but missed the main joke. I kept medium and cut the *felt* wait instead: cache per post, and an honest "Still reading..." after 8 seconds.

## What's next

- Spot a running joke across replies
- "How will this sound?" before you reply. Stop lurking. Start replying.
- A daily recap of what you saved, like a friend texting you
- Bring back what I got a few days later, like a friend asking "remember this one?". Not a test.
- Make "Still confused" a second try: ask again and get it explained a simpler way
- Plain English words too, not only culture. My test showed the misses are words like "manchild" and "bond investors"
- Explain in more languages (Japanese, Chinese, Spanish and others), not only English and Korean
- Read image memes in comments too. Today it reads only the words, and many jokes live in the picture
- Fix what friends trip over while using it
- Test whether other international students reach for it on their own the next time a joke goes over their head

## Timeline

I explored ideas and designed during the week, then built it over the weekend.

## Privacy

IYKYK only reads the words, never who wrote them. What you know is stored in your browser. No account.

## Run it locally

You need Node 20 or newer and an Anthropic API key.

```bash
npm install
echo "ANTHROPIC_API_KEY=your-key" > .env
npm run dev   # open http://localhost:5174
```

To try the extension: open `chrome://extensions`, turn on Developer mode, click **Load unpacked**, and pick the `extension` folder.

## AI appendix

The build log of everything that went wrong is in [`docs/challenges.txt`](docs/challenges.txt), every product decision is in [`docs/decisions.md`](docs/decisions.md), and the test set and scoring code are in [`eval/comments.txt`](eval/comments.txt) and [`eval/`](eval).

---

Made by [Lydia Oh](#)
