function pickDistinct(values, correct, count = 3) {
  const out = [];
  for (const value of values) {
    if (!value || value === correct || out.includes(value)) continue;
    out.push(value);
    if (out.length >= count) break;
  }
  while (out.length < count) {
    out.push(`Heritage idea ${out.length + 1}`);
  }
  return [correct, ...out];
}

function rotate(list, offset) {
  if (!list.length) return list;
  const shift = ((offset % list.length) + list.length) % list.length;
  return [...list.slice(shift), ...list.slice(0, shift)];
}

export function buildGeneratedAgeQuestions(chapterSlug, ageGroup, chapters = []) {
  if (!["entry", "junior"].includes(ageGroup)) return null;

  const chapterIndex = chapters.findIndex((item) => item.slug === chapterSlug);
  if (chapterIndex < 0) return null;

  const chapter = chapters[chapterIndex];
  const others = chapters.filter((item) => item.slug !== chapterSlug);
  const orderedOthers = rotate(others, chapterIndex);
  const learn = Array.isArray(chapter.learn) ? chapter.learn : [];

  const titleOptions = pickDistinct(
    orderedOthers.map((item) => item.title),
    chapter.title,
  );
  const eraOptions = pickDistinct(
    orderedOthers.map((item) => item.era),
    chapter.era || "Across periods",
  );
  const categoryOptions = pickDistinct(
    orderedOthers.map((item) => item.category),
    chapter.category || "Heritage",
  );
  const descriptionOptions = pickDistinct(
    orderedOthers.map((item) => item.description),
    chapter.description,
  );

  const learningQuestions = Array.from({ length: 5 }, (_, index) => {
    const correct =
      learn[index % Math.max(1, learn.length)] ||
      chapter.description ||
      chapter.title;
    const distractors = orderedOthers
      .map((item) =>
        Array.isArray(item.learn) && item.learn.length
          ? item.learn[index % item.learn.length]
          : item.description,
      )
      .filter(Boolean);

    return {
      id: `${chapterSlug}-${ageGroup}-learn-${index + 1}`,
      difficulty: ageGroup === "entry" ? "Entry" : "Medium",
      question:
        ageGroup === "entry"
          ? `Which idea belongs to ${chapter.title}?`
          : `Which learning point is connected with ${chapter.title}?`,
      answers: pickDistinct(distractors, correct),
      correct: 0,
      explanation: `${correct} is one of the key ideas in this Heritage Quest chapter.`,
      hint: `Think about the main ideas shown in the ${chapter.title} learning page.`,
    };
  });

  const common = [
    {
      id: `${chapterSlug}-${ageGroup}-topic`,
      difficulty: ageGroup === "entry" ? "Entry" : "Medium",
      question:
        ageGroup === "entry"
          ? "Which topic are you exploring now?"
          : `Which title matches this learning chapter?`,
      answers: titleOptions,
      correct: 0,
      explanation: `This chapter is about ${chapter.title}.`,
      hint: "Look at the chapter name.",
    },
    {
      id: `${chapterSlug}-${ageGroup}-era`,
      difficulty: ageGroup === "entry" ? "Entry" : "Medium",
      question:
        ageGroup === "entry"
          ? `Which time label belongs to ${chapter.title}?`
          : `Which era or time period is associated with ${chapter.title} in this course?`,
      answers: eraOptions,
      correct: 0,
      explanation: `${chapter.era || "Across periods"} is the time label used for this chapter.`,
      hint: "Remember the era badge shown on the learning card.",
    },
    {
      id: `${chapterSlug}-${ageGroup}-category`,
      difficulty: ageGroup === "entry" ? "Entry" : "Medium",
      question:
        ageGroup === "entry"
          ? `Which group does ${chapter.title} belong to?`
          : `Which Heritage Quest category best fits ${chapter.title}?`,
      answers: categoryOptions,
      correct: 0,
      explanation: `${chapter.title} is grouped under ${chapter.category || "Heritage"}.`,
      hint: "Think about the category label on the chapter.",
    },
    {
      id: `${chapterSlug}-${ageGroup}-description`,
      difficulty: ageGroup === "entry" ? "Entry" : "Medium",
      question:
        ageGroup === "entry"
          ? `Which sentence is about ${chapter.title}?`
          : `Which description best matches ${chapter.title}?`,
      answers: descriptionOptions,
      correct: 0,
      explanation: chapter.description,
      hint: "Choose the sentence that matches this chapter.",
    },
  ];

  const finalQuestion = {
    id: `${chapterSlug}-${ageGroup}-focus`,
    difficulty: ageGroup === "entry" ? "Entry" : "Medium",
    question:
      ageGroup === "entry"
        ? `If you want to learn “${learn[0] || chapter.title}”, which chapter should you choose?`
        : `A student wants to study “${learn[0] || chapter.description}”. Which chapter is the best match?`,
    answers: titleOptions,
    correct: 0,
    explanation: `${learn[0] || chapter.description} is included in ${chapter.title}.`,
    hint: "Match the learning idea with its chapter.",
  };

  return [...common, ...learningQuestions, finalQuestion].slice(0, 10);
}
