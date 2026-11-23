// Sample posts and saved results for the demo page.
// The result shape is the same shape the live AI returns.
// The first two posts use real public Instagram comments (text only, no usernames) from my test set.
// Their saved results are real AI output, used only if the live AI is unavailable.
window.IYKYK_SAMPLES = [
  {
    "id": "gilmore",
    "source": "Instagram post",
    "title": "Friend who finally watched Gilmore Girls",
    "caption": "letting her love dean is the hardest thing i've ever done as a friend",
    "scene": "A woman on a couch looks annoyed. On-screen text: \"Your friend who finally watched Gilmore Girls\" / \"Lorelai and Luke.\"",
    "comments": [
      {
        "id": "c1",
        "text": "\"Rory and..Logan?\" \"Rory and Logan! 👌\" \"Rory and NOT LOGAN?\" EXACTLY THE ROLLERCOASTER I WILL NOT GET OVER. How dare the writers do this to me, to us!"
      },
      {
        "id": "c2",
        "text": "im a 43 year old manchild that lives in a Connecticut town nothing like stars hollow but I made a meme for Gilmore girls fans that know ppl who eat lunch if your interested also im the modern day Luke surpriseeeee"
      }
    ],
    "result": {
      "items": [
        {
          "comment_id": "c1",
          "quote": "\"Rory and..Logan?\" \"Rory and Logan! 👌\" \"Rory and NOT LOGAN?\"",
          "question": "reference",
          "answer": "In Gilmore Girls fans argue over which boyfriend Rory should end up with (Dean, Jess or Logan). This comment replays one viewer's feelings flipping: unsure about Logan, then loving him, then upset when the show moves her away from him.",
          "emoji": null,
          "origin": "Gilmore Girls, where Rory dates Dean, Jess, and Logan, and fans split into 'Team Dean/Jess/Logan'.",
          "closest": "",
          "confidence": 0.8
        }
      ]
    }
  },
  {
    "id": "hallmark",
    "source": "Instagram Reel",
    "title": "The lovable side character with 20 minutes left",
    "caption": "",
    "scene": "A woman in a trench coat, cheerful. On-screen text: \"The lovable side character in every movie who has approximately 20 minutes left to live\"",
    "comments": [
      {
        "id": "c1",
        "text": "She visits Dr. Sherman and tells him she doesn't want to hear the words out loud; to put them in a document she can read in private. Then she puts the papers in her purse and promptly tells the family that the doctor said it was a false alarm and they should all go to Positano to celebrate! [...] She's been doubly blessed. Double Blessing on Hallmark coming soon!"
      },
      {
        "id": "c2",
        "text": "Rite in time for the holiday Christmas magic😭😂😂🤣🎄🥳"
      },
      {
        "id": "c3",
        "text": "Aunt malika is always the coolest. She must live 😂"
      }
    ],
    "result": {
      "items": [
        {
          "comment_id": "c1",
          "quote": "Double Blessing on Hallmark coming soon!",
          "question": "reference",
          "answer": "Hallmark is a US TV channel famous for cheesy, feel-good (especially Christmas) romance movies with predictable plots. The commenter is joking that this made-up sad-but-uplifting story sounds exactly like one of those movies.",
          "emoji": null,
          "origin": "Hallmark Channel is known for formulaic, sentimental made-for-TV movies, especially around the holidays.",
          "closest": "",
          "confidence": 0.9
        },
        {
          "comment_id": "c2",
          "quote": "Rite in time for the holiday Christmas magic",
          "question": "tone",
          "answer": "This is sarcastic. 'Christmas magic' is a cliché of sappy holiday movies, and the commenter is teasing that the doomed side character fits perfectly into that sentimental formula. The crying and laughing emojis show it's dark humor, not real sadness.",
          "emoji": null,
          "origin": "",
          "closest": "",
          "confidence": 0.6
        },
        {
          "comment_id": "c3",
          "quote": "She must live",
          "question": "tone",
          "answer": "This is a hopeful joke going against the video's premise. The commenter says she's so lovable that she should be spared, even though in movies this kind of cheerful side character usually dies.",
          "emoji": null,
          "origin": "",
          "closest": "",
          "confidence": 0.75
        }
      ]
    }
  },
  {
    id: "gift-swap",
    source: "Instagram Reel",
    title: "Family gift swap",
    caption: "Grandma did NOT come to play this year 😭🎁",
    scene: "A family gift swap. Grandma grabs a wrapped gift out of her grandson's hands and walks away smiling.",
    comments: [
      { id: "c1", text: "Not the Christmas heist 💀", likes: "12.4k" },
      { id: "c2", text: "Grandma plays white elephant like it's a contact sport", likes: "8.1k" },
      { id: "c3", text: "My uncle every year: \"I'll just take the gift card\" 😭", likes: "3.2k" },
      { id: "c4", text: "This is giving Clark Griswold energy", likes: "1.9k" },
      { id: "c5", text: "Not actual death but I'm 💀", likes: "980" }
    ],
    result: {
      items: [
        {
          comment_id: "c1",
          quote: "Christmas heist",
          question: "funny",
          answer: "Taking someone's 🎁 in a gift swap, described like a movie robbery.",
          emoji: { char: "💀", meaning: "Not actual death. It means \"I'm dying laughing.\"" },
          origin: "\"Heist\" is the word for big, planned robberies in movies like Ocean's Eleven. Using it for a tiny gift steal is the joke.",
          closest: "Calling something tiny a \"대작전\" (a big operation).",
          confidence: 0.92
        },
        {
          comment_id: "c2",
          quote: "white elephant",
          question: "reference",
          answer: "The American name for a gift swap where you can steal someone else's gift.",
          origin: "Named after rare white elephants that were costly to keep. A gift you can't really use.",
          closest: "",
          confidence: 0.88
        },
        {
          comment_id: "c4",
          quote: "Clark Griswold",
          question: "reference",
          answer: "Probably the dad from a classic Christmas movie who goes way too far with the holidays. Not sure.",
          origin: "",
          closest: "",
          confidence: 0.55
        },
        {
          comment_id: "c5",
          quote: "💀",
          question: "tone",
          answer: "Not actual death. It means \"I'm dying laughing.\"",
          origin: "",
          closest: "",
          confidence: 0.9
        }
      ]
    }
  },
  {
    id: "coffee-shop",
    source: "Instagram Reel",
    title: "Coffee shop chaos",
    caption: "The barista stayed so calm 😮‍💨",
    scene: "A customer argues loudly at a coffee shop counter while the barista smiles and keeps making drinks.",
    comments: [
      { id: "c1", text: "She really said \"can I speak to your manager\" 💀", likes: "21.3k" },
      { id: "c2", text: "The barista deserves a raise and a Purple Heart", likes: "9.4k" },
      { id: "c3", text: "Peak Karen behavior, no notes", likes: "6.0k" },
      { id: "c4", text: "I'm screaming 😭", likes: "2.2k" }
    ],
    result: {
      items: [
        {
          comment_id: "c1",
          quote: "💀",
          question: "tone",
          answer: "Not actual death. It means \"I'm dying laughing.\"",
          origin: "",
          closest: "",
          confidence: 0.9
        },
        {
          comment_id: "c2",
          quote: "Purple Heart",
          question: "reference",
          answer: "A US military medal for soldiers wounded in battle. Here: the barista basically survived a war.",
          origin: "One of the oldest US military awards. People use it as a joke for surviving something painful.",
          closest: "",
          confidence: 0.9
        },
        {
          comment_id: "c3",
          quote: "Karen",
          question: "tone",
          answer: "Someone who acts entitled and demands the manager.",
          origin: "A meme name that spread around 2018 to 2020 for this kind of behavior.",
          closest: "Close to \"진상 손님\".",
          confidence: 0.9
        }
      ]
    }
  }
];
