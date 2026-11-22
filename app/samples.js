// Sample posts and saved results for the demo page.
// The result shape is the same shape the live AI returns.
window.IYKYK_SAMPLES = [
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
