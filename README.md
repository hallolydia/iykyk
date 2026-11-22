# IYKYK

**If you know, you know. Now you know.**

IYKYK finds the cultural context you're missing in English comments, explains just enough, and remembers what you already know.

[Live demo](https://iykyk-eta.vercel.app) · [Pitch video](#) · [PRD](PRD.md) · [Design](DESIGN.md) · [Decisions](decisions.md)

<!-- TODO: hero screenshot or GIF -->

---

## Why I built this

I live in the US. I understand every word in the comments. I still don't get the joke.

The jokes sit on top of memes, old TV shows, sports, and celebrities that people raised here just know. The problem isn't English. It's context, and **you can't search for something you don't know you're missing.**

I could ask ChatGPT. But by the time I copy the comment, switch apps, and write a question, I've already scrolled past.

It isn't only vocabulary. I didn't grow up with the history, the politics, or the TV that people here share, and the sense of humor is different too. So I often can't tell where the joke is, and I can't ask someone "why is this funny?" every single time.

[TODO: one real comment I didn't get, and what I did next]

## How it works

1. **Find.** IYKYK underlines the phrases someone raised outside the US would likely miss. You don't have to ask.
2. **Explain.** One click opens a card that answers the question you'd actually have: *Why is this funny? What's the reference? Is this rude or friendly?*
3. **Remember.** Tap *I knew this* and it stays hidden next time. The more you use it, the quieter it gets.

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

27 comments, labeled by hand before I looked at any AI output: 6 I didn't get, 12 half got, 8 easy, 1 sensitive (a grief comment, to check the tone).
14 are real Instagram comments, 2 are sentences from news articles, and 11 are short examples I wrote with Claude to cover sports, politics, money and sarcasm. Those 11 are marked `SYNTHETIC` in [`comments.txt`](comments.txt), and I labeled them myself like the rest.

How it is scored ([`eval/score.mjs`](eval/score.mjs), results in [`eval/results.md`](eval/results.md)):
- **Underline is right** when the AI's quote overlaps a phrase I marked as a gap in that comment.
- **My gap found** when one of my gaps overlaps something the AI underlined.
- The sensitive comment is left out of the numbers and read by eye.

| Prompt version | Underlines that were right | My gaps it found | What changed |
|---|---|---|---|
| v1 | 61% (14 of 23) | 65% (15 of 23) | First prompt: what counts as a gap, how to explain it |
| v2 | 64% (14 of 22) | 65% (15 of 23) | General rules: brand, channel and show names can be the hinge; punchlines sit at the end of long comments |
| v3 | 68% (15 of 22) | 65% (15 of 23) | Added the sound and video frames as input, and several home countries |

Targets: 80% or more of underlines right (most important), 60% or more of my gaps found.
**Where it stands:** gaps found meets the target. Underlines right does not (68%, target 80%).

Read this table with care. This test sends only the comment text, so v3's new inputs (sound, frames) were not used. With 27 comments and one run each, a few points between versions is noise, not progress. The honest result is that all three prompts are about the same on this set, and the next gain has to come from somewhere else.

**Most common errors (v3):**
- **Underlining what I said was easy (6 of 7 wrong underlines).** "Sure, Jan.", "Love that for you.", "401(k)", "seconds", "the dog days of summer". Some of these may be real gaps I did not know I had: my own guess on "Not you guys waiting in the train" turned out to be wrong, and the AI had underlined it.
- **Missing plain English I did not know (8 missed gaps).** "freeway", "manchild", "take it back", "misogynistic cliché", "bond investors", "saving it". These are not culture, they are vocabulary and finance words, which the prompt does not look for.
- **Missing fan-talk.** A comment about a TV couple ("Rory and..Logan?") needed knowing the show, and was missed.
- **The grief comment got no underline and no joke**, which is the behavior I wanted.

### Comment only vs. comment + scene

Same 27 comments, with and without a one-line description of the scene (text only, no images).

| Input | Underlines that were right | My gaps it found |
|---|---|---|
| Comment only (v3) | 68% | 65% |
| Comment + scene text (v3) | 61% | 65% |

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

## Challenges I hit

- **The AI underlined the wrong half of a joke.** On "Not the Christmas heist", it flagged "Not the" (a slang pattern) and skipped "Christmas heist", the actual hinge. Both were real gaps, but the joke lives in one of them. I decided which one is the hinge in the test set and the prompt, instead of letting the AI guess.
- **The AI missed the punchline of a long comment.** It flagged "the doctor said it was a false alarm" and missed "Hallmark", the brand the whole parody depends on. Prompt v2 added general rules (brand, channel, and show names can be hinges; punchlines sit at the end of long comments) without naming any test answer, so the score stays honest.
- **Faster was not better.** Medium effort took about 12 seconds per post. Low effort took 6 but missed the main joke. I kept medium and cut the *felt* wait instead: cache per post, and an honest "Still reading..." after 8 seconds.

## What's next

- Spot a running joke across replies
- "How will this sound?" before you reply. Stop lurking. Start replying.
- A daily recap of what you saved, like a friend texting you
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

The build log of everything that went wrong is in [`challenges.txt`](challenges.txt), every product decision is in [`decisions.md`](decisions.md), and the test set and scoring code are in [`comments.txt`](comments.txt) and [`eval/`](eval).

---

Made by [Lydia Oh](#)
