const AGE_LABELS = {
  entry: "Little Explorer - Entry level",
  junior: "Young Explorer - Medium level",
  scholar: "Heritage Scholar - Medium + Advanced",
  open: "Open Explorer - Full question set",
};

const HERITAGE_FACTS = [
  {
    terms: ["taj mahal"],
    answer:
      "Mughal emperor Shah Jahan commissioned the Taj Mahal in 1632, and the complex was completed around 1653.",
  },
  {
    terms: ["qutub minar", "qutb minar"],
    answer:
      "Qutb-ud-din Aibak began the Qutub Minar around 1199, and Iltutmish completed most of it in the 13th century.",
  },
  {
    terms: ["red fort", "lal qila"],
    answer:
      "Mughal emperor Shah Jahan built Delhi's Red Fort between 1638 and 1648 when he moved his capital to Shahjahanabad.",
  },
  {
    terms: ["india gate"],
    answer:
      "India Gate was designed by Edwin Lutyens; its foundation stone was laid in 1921 and it was completed in 1931.",
  },
  {
    terms: ["gateway of india"],
    answer:
      "The Gateway of India in Mumbai was designed by George Wittet and completed in 1924.",
  },
  {
    terms: ["hawa mahal"],
    answer:
      "Hawa Mahal was built in Jaipur in 1799 by Maharaja Sawai Pratap Singh and designed by Lal Chand Ustad.",
  },
  {
    terms: ["konark sun temple", "konark temple"],
    answer:
      "The Konark Sun Temple was built around 1250 CE under Eastern Ganga king Narasimhadeva I.",
  },
  {
    terms: [
      "brihadeeswarar temple",
      "brihadisvara temple",
      "big temple thanjavur",
    ],
    answer:
      "Rajaraja Chola I built the Brihadeeswarar Temple at Thanjavur, completed around 1010 CE.",
  },
  {
    terms: ["sanchi stupa", "great stupa"],
    answer:
      "Emperor Ashoka first commissioned the Great Stupa at Sanchi in the 3rd century BCE; it was enlarged later.",
  },
  {
    terms: ["ajanta caves", "ajanta"],
    answer:
      "The Buddhist Ajanta Caves were created in phases from about the 2nd century BCE to the 6th century CE.",
  },
  {
    terms: ["ellora caves", "ellora"],
    answer:
      "The Hindu, Buddhist and Jain caves at Ellora were created mainly between the 6th and 10th centuries CE.",
  },
  {
    terms: ["charminar"],
    answer:
      "Muhammad Quli Qutb Shah built the Charminar in Hyderabad in 1591.",
  },
  {
    terms: [
      "indus valley civilization",
      "harappan civilization",
      "harappa civilization",
    ],
    answer:
      "The mature Indus or Harappan Civilization flourished roughly from 2600 to 1900 BCE, with major cities such as Harappa and Mohenjo-daro.",
  },
  {
    terms: ["maurya empire", "mauryan empire"],
    answer:
      "Chandragupta Maurya founded the Maurya Empire around 322 BCE; it reached its greatest extent under Ashoka.",
  },
  {
    terms: ["emperor ashoka", "king ashoka", "ashoka"],
    answer:
      "Ashoka was a Mauryan emperor who ruled in the 3rd century BCE. After the Kalinga War, he promoted dhamma through inscriptions across his empire.",
  },
  {
    terms: ["gupta empire", "gupta period"],
    answer:
      "The Gupta Empire rose around 320 CE under Chandragupta I and became known for major achievements in art, literature, mathematics and science.",
  },
  {
    terms: ["chola dynasty", "chola empire", "cholas"],
    answer:
      "The imperial Cholas were a major South Indian power from about the 9th to 13th centuries, especially under Rajaraja I and Rajendra I.",
  },
  {
    terms: ["mughal empire", "mughals"],
    answer:
      "Babur founded the Mughal Empire in India in 1526 after the First Battle of Panipat.",
  },
  {
    terms: [
      "indian independence",
      "independence day",
      "india get independence",
      "india became independent",
    ],
    answer:
      "India became independent from British rule on 15 August 1947; Jawaharlal Nehru became its first Prime Minister.",
  },
  {
    terms: ["constitution of india", "indian constitution"],
    answer:
      "India's Constitution was adopted on 26 November 1949 and came into force on 26 January 1950. B. R. Ambedkar chaired its Drafting Committee.",
  },
  {
    terms: ["republic day"],
    answer:
      "India celebrates Republic Day on 26 January because the Constitution came into force on that date in 1950.",
  },
  {
    terms: ["mahatma gandhi", "gandhiji"],
    answer:
      "Mahatma Gandhi was born on 2 October 1869 and led major non-violent movements against British rule in India.",
  },
  {
    terms: ["b r ambedkar", "br ambedkar", "dr ambedkar", "ambedkar"],
    answer:
      "B. R. Ambedkar was a jurist, anti-caste reformer and chairman of India's Constitution Drafting Committee; he was born on 14 April 1891.",
  },
  {
    terms: ["national anthem", "jana gana mana"],
    answer:
      "India's national anthem is 'Jana Gana Mana,' written by Rabindranath Tagore and adopted in 1950.",
  },
  {
    terms: ["national song", "vande mataram"],
    answer:
      "India's national song is 'Vande Mataram,' written by Bankim Chandra Chattopadhyay.",
  },
  {
    terms: ["nalanda university", "nalanda"],
    answer:
      "Ancient Nalanda became a major Buddhist centre of learning from about the 5th century CE, with early patronage linked to Kumaragupta I.",
  },
  {
    terms: ["zero invented", "invented zero", "discovered zero"],
    answer:
      "Zero developed through Indian mathematics over time; Brahmagupta gave formal arithmetic rules for zero in 628 CE.",
  },
  {
    terms: ["antikythera mechanism", "antikythera"],
    answer:
      "The Antikythera mechanism was an ancient Greek geared device, made around the 2nd or 1st century BCE to calculate astronomical cycles.",
  },
];

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "can",
  "did",
  "do",
  "does",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "of",
  "on",
  "please",
  "tell",
  "the",
  "this",
  "to",
  "was",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
]);

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(
      /[^a-z0-9\u00c0-\u024f\u0900-\u097f\u0980-\u09ff\u0b80-\u0bff\u0c00-\u0c7f\u0c80-\u0cff\s-]/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function hasPhrase(text, phrase) {
  const source = normalize(text);
  const target = normalize(phrase);
  if (!source || !target) return false;
  return source === target || ` ${source} `.includes(` ${target} `);
}

function includesAny(text, phrases) {
  return phrases.some((phrase) => hasPhrase(text, phrase));
}

function titleMatch(text, item) {
  const title = normalize(item?.title);
  return Boolean(title && title.length >= 4 && hasPhrase(text, title));
}

function meaningfulTokens(value) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function findVerifiedStudyQuestion(text, questionBank) {
  const q = normalize(text);
  if (!q || q.length < 4) return null;

  const exact = questionBank.find((item) => {
    const candidate = normalize(item?.question);
    return (
      candidate &&
      (q === candidate ||
        (q.length >= 18 && candidate.includes(q)) ||
        (candidate.length >= 18 && q.includes(candidate)))
    );
  });
  if (exact) return exact;

  const queryTokens = [...new Set(meaningfulTokens(q))];
  if (queryTokens.length < 2) return null;

  let best = null;
  let bestScore = 0;
  for (const item of questionBank) {
    const candidateTokens = [...new Set(meaningfulTokens(item?.question))];
    if (!candidateTokens.length) continue;

    const candidateSet = new Set(candidateTokens);
    const shared = queryTokens.filter((token) => candidateSet.has(token)).length;
    if (shared < 2) continue;

    const score =
      shared / queryTokens.length +
      (shared / candidateTokens.length) * 0.35;
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }

  return bestScore >= 0.72 ? best : null;
}

function matchHeritageFact(text) {
  return HERITAGE_FACTS.find((fact) =>
    fact.terms.some((term) => hasPhrase(text, term)),
  );
}

function endSentence(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function concise(value, maximum = 220) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maximum) return text;
  const shortened = text.slice(0, maximum - 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > 160 ? lastSpace : maximum - 1)}…`;
}

export function answerFromKnowledge({
  question,
  games = [],
  topics = [],
  settings = {},
  player,
  questionBank = [],
}) {
  const q = normalize(question);

  if (!q) return "Please type a question. I’ll keep the answer short.";

  if (includesAny(q, ["good morning", "morning"])) {
    return "Very good morning! How can I help you today?";
  }

  if (includesAny(q, ["good afternoon", "afternoon"])) {
    return "Very good afternoon! How can I help you today?";
  }

  if (includesAny(q, ["good evening", "evening"])) {
    return "Very good evening! How can I help you today?";
  }

  if (includesAny(q, ["good night"])) {
    return "Good night! Have a peaceful rest, and come back anytime you need help.";
  }

  if (
    includesAny(q, [
      "hi",
      "hello",
      "hey",
      "vanakkam",
      "வணக்கம்",
      "namaste",
      "नमस्ते",
    ])
  ) {
    return "Hello! How can I help you with Indian heritage or Heritage Quest?";
  }

  if (includesAny(q, ["how are you", "how r u"])) {
    return "I’m doing well and ready to help! What would you like to know?";
  }

  if (includesAny(q, ["thank you", "thanks", "thank u"])) {
    return "You’re welcome! Ask me anything else whenever you’re ready.";
  }

  if (includesAny(q, ["bye", "goodbye", "see you"])) {
    return "Goodbye! Keep exploring India’s amazing heritage.";
  }

  if (includesAny(q, ["who are you", "what can you do"])) {
    return "I’m Heritage Helper. I give short answers about Indian history and Heritage Quest features.";
  }

  const heritageFact = matchHeritageFact(q);
  if (heritageFact) return heritageFact.answer;

  const verifiedQuestion = findVerifiedStudyQuestion(q, questionBank);
  if (verifiedQuestion) {
    const correctAnswer = Array.isArray(verifiedQuestion.answers)
      ? verifiedQuestion.answers[Number(verifiedQuestion.correct || 0)]
      : "";
    return concise(
      correctAnswer
        ? endSentence(correctAnswer)
        : verifiedQuestion.explanation || "I found the topic, but not a complete answer.",
    );
  }

  const matchedTopic = topics.find((topic) => titleMatch(q, topic));
  if (matchedTopic) {
    return concise(
      `${matchedTopic.title}: ${matchedTopic.description || "A Heritage Quest learning topic."}${matchedTopic.era ? ` Era: ${matchedTopic.era}.` : ""}`,
    );
  }

  const matchedGame = games.find((game) => titleMatch(q, game));
  if (matchedGame) {
    return concise(
      `${matchedGame.title} is a ${matchedGame.difficulty || "learning"} ${matchedGame.category || "heritage"} game. ${matchedGame.description || "Open the Games page to play it."}`,
    );
  }

  if (
    includesAny(q, [
      "how do i start",
      "how to start",
      "start learning",
      "begin",
      "register",
      "sign up",
      "create account",
    ])
  ) {
    return "Register with your name, email, password and date of birth, then open Learn or Games. Your date of birth selects the suitable question level.";
  }

  if (
    includesAny(q, ["login", "log in", "sign in", "enter again", "same account"])
  ) {
    return "Use your registered email and password on the Login tab to restore your saved profile and progress.";
  }

  if (
    includesAny(q, [
      "age",
      "age group",
      "question level",
      "which questions",
      "my level",
      "difficulty",
      "entry level",
      "advanced level",
    ])
  ) {
    const personal = player?.ageGroup
      ? ` Your level is ${AGE_LABELS[player.ageGroup] || player.ageGroup}.`
      : "";
    return `Ages 1–5 get Entry, 6–9 Medium, 10–16 Medium + Advanced, and 17+ the full question set.${personal}`;
  }

  if (
    includesAny(q, [
      "certificate",
      "certificates",
      "download certificate",
      "completion certificate",
    ])
  ) {
    return "Complete an eligible chapter or task to earn a personalized certificate, which you can download or print as a PDF.";
  }

  if (
    includesAny(q, ["leaderboard", "ranking", "rank", "points", "weekly goal"])
  ) {
    return `The leaderboard uses saved quiz scores for Daily, Weekly and All Time rankings. The weekly goal is ${Number(settings.weeklyGoalPoints || 700)} points.`;
  }

  if (
    includesAny(q, [
      "daily challenge",
      "today challenge",
      "today progress",
      "progress today",
    ])
  ) {
    return `Today’s challenge target is ${Number(settings.dailyChallengeQuestions || 5)} answered questions, calculated from your saved quiz activity.`;
  }

  if (
    includesAny(q, ["progress", "saved progress", "activity", "my score"])
  ) {
    return "Your quiz progress, scores and gameplay activity are saved to your account and return when you log in again.";
  }

  if (
    includesAny(q, [
      "language",
      "languages",
      "tamil",
      "hindi",
      "telugu",
      "kannada",
      "urdu",
      "22",
    ])
  ) {
    return "Heritage Quest supports English and all 22 Scheduled Indian languages, including Tamil, Hindi, Telugu, Kannada and Urdu.";
  }

  if (
    includesAny(q, [
      "show games",
      "show me the games",
      "games available",
      "list games",
      "what games",
    ])
  ) {
    return `Heritage Quest currently has ${games.length} learning games. Open the Games page to view and play them.`;
  }

  if (
    includesAny(q, [
      "learning chapters",
      "chapters",
      "study material",
      "study materials",
      "what can i learn",
      "learn page",
      "topics",
    ])
  ) {
    return `There are ${topics.length} learning chapters covering Indian history, monuments, dynasties, culture and more. Open Learn to explore them.`;
  }

  if (
    includesAny(q, ["profile", "student profile", "settings", "my account"])
  ) {
    return "Use Profile to view your information and learning summary, and Settings to update student preferences.";
  }

  if (
    includesAny(q, [
      "what is heritage quest",
      "about website",
      "what is this website",
      "website purpose",
      "heritage quest",
    ])
  ) {
    return "Heritage Quest teaches Indian history and culture through short lessons, quizzes, games, progress tracking and certificates.";
  }

  return "I couldn’t verify that answer yet. Try asking about Indian history, monuments, rulers, chapters, games, progress or certificates.";
}
