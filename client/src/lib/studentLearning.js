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
