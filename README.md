# IYKYK

**If you know, you know. Now you know.**

IYKYK finds the cultural context you're missing in English comments, explains just enough, and remembers what you already know.

[Live demo](#) · [Pitch video](#) · [PRD](PRD.md) · [Design](DESIGN.md) · [Decisions](decisions.md)

<!-- TODO: hero screenshot or GIF -->

---

## Why I built this

I live in the US. I understand every word in the comments. I still don't get the joke.

The jokes sit on top of memes, old TV shows, sports, and celebrities that people raised here just know. The problem isn't English. It's context, and **you can't search for something you don't know you're missing.**

I could ask ChatGPT. But by the time I copy the comment, switch apps, and write a question, I've already scrolled past.

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

20 real Instagram comments, labeled by hand: [TODO] I didn't get, [TODO] easy, [TODO] unclear, [TODO] sensitive.

| Prompt version | Underlines that were right | My gaps it found | What changed |
|---|---|---|---|
| v1 | [TODO]% | [TODO]% | [TODO] |
| v2 | [TODO]% | [TODO]% | [TODO] |
| v3 | [TODO]% | [TODO]% | [TODO] |

Targets: 80% or more of underlines right (most important), 60% or more of my gaps found.

Most common errors: [TODO]

### Comment only vs. comment + scene

Same comment, two inputs.

> "Not the Christmas heist 💀"

- **Comment only:** [TODO: AI output]
- **Comment + scene:** [TODO: AI output]

What I decided: [TODO]

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

- [TODO: real problem > how I fixed it]
- [TODO]

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

```bash
# TODO
```

## AI appendix

Prompts and the build log are in [`/prompts`](prompts). [TODO]

---

Made by [Lydia Oh](#)
