export const TOTAL_CHAPTERS = 12;

export function readableSlug(value = "") {
  return String(value)
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatLearningDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(
    undefined,
    withTime
      ? { dateStyle: "medium", timeStyle: "short" }
      : { dateStyle: "medium" },
  );
}

export function activityLabel(type) {
  const labels = {
    question_answered: "Answered a quiz question",
    chapter_completed: "Completed a chapter",
    pretest_video_completed: "Watched the lesson video",
    pretest_video_skipped: "Skipped the lesson video",
    word_puzzle_answered: "Answered a word puzzle",
    word_game_completed: "Completed Heritage Word Quest",
    word_game_video_completed: "Watched the word-game lesson",
    word_game_video_skipped: "Skipped the word-game lesson",
  };
  return labels[type] || readableSlug(type);
}

function daysSince(value, now) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86400000));
}

export function buildImprovementPlan(student, now = new Date()) {
  if (!student) return [];

  const progressRows = Array.isArray(student.progressRows)
    ? student.progressRows
    : [];
  const totalAnswers = Number(student.totalAnswers || 0);
  const accuracy = Number(student.accuracy || 0);
  const completed = Number(student.completed || 0);
  const inactiveDays = daysSince(student.lastActive, now);
  const inProgressChapter = progressRows.find((row) => !row.finished);
  const attemptedChapters = progressRows.filter((row) => row.answerCount > 0);
  const weakestChapter = [...attemptedChapters].sort(
    (a, b) => a.accuracy - b.accuracy || b.answerCount - a.answerCount,
  )[0];
  const lockedAchievements = (student.achievements || [])
    .filter((achievement) => !achievement.unlocked)
    .sort(
      (a, b) =>
        b.progress - a.progress ||
        a.target - a.current - (b.target - b.current),
    );

  const plan = [];

  if (inactiveDays === null) {
    plan.push({
      id: "start-routine",
      priority: "Start here",
      tone: "orange",
      title: "Begin a simple learning routine",
      detail:
        "Choose one chapter and spend 15 focused minutes on its lesson and quiz.",
      goal: "Record the first learning activity this week.",
    });
  } else if (inactiveDays >= 7) {
    plan.push({
      id: "restore-routine",
      priority: "Start here",
      tone: "orange",
      title: "Restore a steady learning routine",
      detail: `No activity has been recorded for ${inactiveDays} days. Schedule three short practice sessions instead of one long session.`,
      goal: "Complete three 15-minute sessions over the next seven days.",
    });
  } else {
    plan.push({
      id: "maintain-routine",
      priority: "This week",
      tone: "green",
      title: "Keep the current learning rhythm",
      detail:
        "Continue with short, regular sessions and finish each session by explaining one idea in your own words.",
      goal: "Learn on at least three different days this week.",
    });
  }

  if (!totalAnswers) {
    plan.push({
      id: "build-quiz-baseline",
      priority: "Core skill",
      tone: "blue",
      title: "Build a quiz-performance baseline",
      detail:
        "Read the lesson first, answer one complete quiz, and review every explanation after submitting an answer.",
      goal: "Complete at least 10 quiz questions.",
    });
  } else if (accuracy < 60) {
    plan.push({
      id: "strengthen-foundations",
      priority: "Core skill",
      tone: "orange",
      title: weakestChapter
        ? `Review ${readableSlug(weakestChapter.chapter_slug)}`
        : "Strengthen core concepts",
      detail:
        "Revisit the lesson and make a short note for each incorrect answer before trying the quiz again.",
      goal: `Raise overall accuracy from ${accuracy}% to at least 70%.`,
    });
  } else if (accuracy < 80) {
    plan.push({
      id: "close-knowledge-gaps",
      priority: "Core skill",
      tone: "blue",
      title: weakestChapter
        ? `Close gaps in ${readableSlug(weakestChapter.chapter_slug)}`
        : "Close the remaining knowledge gaps",
      detail:
        "Group missed questions by topic, review the matching lesson sections, then retry without using hints.",
      goal: `Move accuracy from ${accuracy}% to 80% or higher.`,
    });
  } else {
    plan.push({
      id: "extend-mastery",
      priority: "Challenge",
      tone: "green",
      title: "Extend strong quiz mastery",
      detail:
        "After each correct answer, explain why the other choices are incorrect to deepen understanding.",
      goal: `Maintain at least ${accuracy}% accuracy across the next 20 answers.`,
    });
  }

  if (inProgressChapter) {
    plan.push({
      id: "finish-current-chapter",
      priority: "Next step",
      tone: "blue",
      title: `Finish ${readableSlug(inProgressChapter.chapter_slug)}`,
      detail:
        "Return to this in-progress chapter before starting a new one, then review its lowest-confidence questions.",
      goal: "Complete the chapter and earn its certificate.",
    });
  } else if (completed < TOTAL_CHAPTERS) {
    plan.push({
      id: "continue-chapters",
      priority: "Next step",
      tone: "blue",
      title: "Continue to the next heritage chapter",
      detail:
        "Select one new chapter that interests the student and complete its lesson and quiz as one learning cycle.",
      goal: `Progress from ${completed} to ${Math.min(completed + 1, TOTAL_CHAPTERS)} completed chapters.`,
    });
  } else {
    plan.push({
      id: "consolidate-chapters",
      priority: "Next step",
      tone: "green",
      title: "Consolidate all-chapter knowledge",
      detail:
        "Revisit the three most difficult chapters and create a short timeline or concept map linking them together.",
      goal: "Complete one mixed review session each week.",
    });
  }

  const nextAchievement = lockedAchievements[0];
  if (nextAchievement) {
    plan.push({
      id: "next-milestone",
      priority: "Motivation",
      tone: "gold",
      title: `Work toward ${nextAchievement.name}`,
      detail: nextAchievement.detail,
      goal: `Move from ${nextAchievement.current} of ${nextAchievement.target} to the next milestone.`,
    });
  } else {
    plan.push({
      id: "sustain-achievements",
      priority: "Motivation",
      tone: "gold",
      title: "Celebrate and sustain full achievement",
      detail:
        "Review completed work, choose a favourite heritage topic, and teach its key ideas to someone else.",
      goal: "Create one short student-led recap or presentation.",
    });
  }

  return plan.slice(0, 4);
}

function groupByUser(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const current = grouped.get(row.user_id);
    if (current) current.push(row);
    else grouped.set(row.user_id, [row]);
  }
  return grouped;
}

function latestDate(...values) {
  let latest = null;
  let latestTime = 0;
  for (const value of values) {
    const time = value ? new Date(value).getTime() : 0;
    if (Number.isFinite(time) && time > latestTime) {
      latest = value;
      latestTime = time;
    }
  }
  return latest;
}

function buildAchievements({ completed, totalAnswers, correctAnswers, certificates }) {
  const definitions = [
    {
      id: "first-quest",
      name: "First Quest",
      detail: "Complete the first learning chapter",
      current: completed,
      target: 1,
    },
    {
      id: "history-explorer",
      name: "History Explorer",
      detail: "Complete five learning chapters",
      current: completed,
      target: 5,
    },
    {
      id: "quiz-master",
      name: "Quiz Master",
      detail: "Answer 100 quiz questions",
      current: totalAnswers,
      target: 100,
    },
    {
      id: "sharp-scholar",
      name: "Sharp Scholar",
      detail: "Answer 80 quiz questions correctly",
      current: correctAnswers,
      target: 80,
    },
    {
      id: "certificate-collector",
      name: "Certificate Collector",
      detail: "Earn three completion certificates",
      current: certificates,
      target: 3,
    },
    {
      id: "heritage-guardian",
      name: "Heritage Guardian",
      detail: "Complete all twelve chapters",
      current: completed,
      target: TOTAL_CHAPTERS,
    },
  ];

  return definitions.map((achievement) => ({
    ...achievement,
    unlocked: achievement.current >= achievement.target,
    progress: Math.min(
      100,
      Math.round((achievement.current / achievement.target) * 100),
    ),
  }));
}

export function buildStudentReports(
  profiles = [],
  progress = [],
  activity = [],
  certificates = [],
) {
  const progressByUser = groupByUser(progress);
  const activityByUser = groupByUser(activity);
  const certificatesByUser = groupByUser(certificates);

  return profiles.map((profile) => {
    const progressRows = [...(progressByUser.get(profile.user_id) || [])]
      .map((row) => {
        const answers = Array.isArray(row.answers) ? row.answers : [];
        const correctCount = answers.filter((answer) => answer?.correct).length;
        return {
          ...row,
          answerCount: answers.length,
          correctCount,
          accuracy: answers.length
            ? Math.round((correctCount / answers.length) * 100)
            : 0,
        };
      })
      .sort((a, b) =>
        String(b.updated_at || "").localeCompare(String(a.updated_at || "")),
      );
    const activityRows = [...(activityByUser.get(profile.user_id) || [])].sort(
      (a, b) =>
        String(b.created_at || "").localeCompare(String(a.created_at || "")),
    );
    const certificateRows = [
      ...(certificatesByUser.get(profile.user_id) || []),
    ].sort((a, b) =>
      String(b.issued_at || "").localeCompare(String(a.issued_at || "")),
    );

    const totalAnswers = progressRows.reduce(
      (sum, row) => sum + row.answerCount,
      0,
    );
    const correctAnswers = progressRows.reduce(
      (sum, row) => sum + row.correctCount,
      0,
    );
    const completed = progressRows.filter((row) => row.finished).length;
    const achievements = buildAchievements({
      completed,
      totalAnswers,
      correctAnswers,
      certificates: certificateRows.length,
    });

    return {
      ...profile,
      progressRows,
      activityRows,
      certificateRows,
      achievements,
      unlockedAchievements: achievements.filter((item) => item.unlocked).length,
      totalScore: progressRows.reduce(
        (sum, row) => sum + Number(row.score || 0),
        0,
      ),
      totalXp: progressRows.reduce(
        (sum, row) => sum + Number(row.xp || 0),
        0,
      ),
      completed,
      totalAnswers,
      correctAnswers,
      accuracy: totalAnswers
        ? Math.round((correctAnswers / totalAnswers) * 100)
        : 0,
      lastActive: latestDate(
        activityRows[0]?.created_at,
        progressRows[0]?.updated_at,
      ),
    };
  });
}
