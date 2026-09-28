import {
  activityLabel,
  formatLearningDate,
  readableSlug,
  TOTAL_CHAPTERS,
} from "./studentLearning.js";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CONTENT_BOTTOM = 278;

function reportFileName(name) {
  const studentName = String(name || "student")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  return `heritage-quest-${studentName || "student"}-report-${date}.pdf`;
}

function printable(value) {
  return String(value ?? "—")
    .replace(/[•·]/g, "-")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');
}

export function createStudentReportPdf(student, improvementPlan, JsPdf) {
  const doc = new JsPdf({ orientation: "portrait", unit: "mm", format: "a4" });
  const generatedAt = new Date();
  let y = 0;

  const ensureSpace = (height) => {
    if (y + height <= CONTENT_BOTTOM) return;
    doc.addPage();
    y = 18;
  };

  const wrappedLines = (text, width) =>
    doc.splitTextToSize(printable(text), width);

  const addSection = (title, subtitle) => {
    ensureSpace(subtitle ? 19 : 13);
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, subtitle ? 16 : 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(6, 95, 70);
    doc.text(printable(title), MARGIN + 4, y + 6.5);
    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(printable(subtitle), MARGIN + 4, y + 12);
    }
    y += subtitle ? 20 : 14;
  };

  const addKeyValueGrid = (entries) => {
    const columnWidth = CONTENT_WIDTH / 2;
    entries.forEach((entry, index) => {
      if (index % 2 === 0) ensureSpace(14);
      const column = index % 2;
      const x = MARGIN + column * columnWidth;
      const rowY = y;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(printable(entry.label).toUpperCase(), x, rowY);
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(printable(entry.value), x, rowY + 5);
      if (column === 1 || index === entries.length - 1) y += 14;
    });
  };

  const addListItem = (title, detail, options = {}) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(options.titleSize || 10);
    const titleLines = wrappedLines(title, CONTENT_WIDTH - 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(options.detailSize || 8.5);
    const detailLines = detail
      ? wrappedLines(detail, CONTENT_WIDTH - 8)
      : [];
    const height = 5 + titleLines.length * 4.5 + detailLines.length * 4 + 3;
    ensureSpace(height);

    doc.setFillColor(...(options.fill || [248, 250, 252]));
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, height - 2, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(options.titleSize || 10);
    doc.setTextColor(15, 23, 42);
    doc.text(titleLines, MARGIN + 4, y + 5.5);
    if (detailLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(options.detailSize || 8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        detailLines,
        MARGIN + 4,
        y + 5.5 + titleLines.length * 4.5,
      );
    }
    y += height;
  };

  doc.setProperties({
    title: `Heritage Quest Student Report - ${student.full_name || "Student"}`,
    subject: "Learning progress and personalized improvement plan",
    author: "Heritage Quest",
    creator: "Heritage Quest",
  });

  doc.setFillColor(17, 67, 54);
  doc.rect(0, 0, PAGE_WIDTH, 43, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("HERITAGE QUEST", MARGIN, 15);
  doc.setFontSize(14);
  doc.text("Student Learning & Improvement Report", MARGIN, 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(209, 250, 229);
  doc.text(
    printable(`Generated ${formatLearningDate(generatedAt.toISOString(), true)}`),
    MARGIN,
    33,
  );
  doc.text("For authorized teacher and administrator use", MARGIN, 38);
  y = 52;

  addSection("Student profile");
  addKeyValueGrid([
    { label: "Student", value: student.full_name || "Student" },
    { label: "Date of birth", value: formatLearningDate(student.dob) },
    { label: "Age group", value: readableSlug(student.age_group || "scholar") },
    { label: "Preferred language", value: student.preferred_language || "English" },
    { label: "Joined", value: formatLearningDate(student.created_at) },
    { label: "Last active", value: formatLearningDate(student.lastActive, true) },
  ]);

  addSection("Learning summary");
  addKeyValueGrid([
    { label: "Chapters completed", value: `${student.completed}/${TOTAL_CHAPTERS}` },
    { label: "Overall accuracy", value: `${student.accuracy}%` },
    { label: "Total score", value: Number(student.totalScore || 0) },
    { label: "Total XP", value: Number(student.totalXp || 0) },
    { label: "Questions answered", value: Number(student.totalAnswers || 0) },
    { label: "Correct answers", value: Number(student.correctAnswers || 0) },
    {
      label: "Achievements",
      value: `${student.unlockedAchievements}/${student.achievements?.length || 0}`,
    },
    { label: "Certificates", value: student.certificateRows?.length || 0 },
  ]);

  addSection(
    "Personalized improvement plan",
    "Suggested next actions based on this student's current saved learning record.",
  );
  (improvementPlan || []).forEach((item, index) => {
    addListItem(
      `${index + 1}. ${item.title} (${item.priority})`,
      `${item.detail} Target: ${item.goal}`,
      { fill: index % 2 ? [255, 251, 235] : [240, 253, 250] },
    );
  });

  addSection(
    "Chapter progress",
    "Completion, quiz performance, XP, and the most recent saved update.",
  );
  if (student.progressRows?.length) {
    student.progressRows.forEach((row) => {
      addListItem(
        `${readableSlug(row.chapter_slug)} - ${row.finished ? "Completed" : "In progress"}`,
        `Score ${Number(row.score || 0)} | Accuracy ${row.accuracy}% | XP ${Number(row.xp || 0)} | Updated ${formatLearningDate(row.updated_at, true)}`,
      );
    });
  } else {
    addListItem("No chapter progress yet", "The student has not started a quiz.");
  }

  addSection("Achievements & milestones");
  (student.achievements || []).forEach((achievement) => {
    addListItem(
      `${achievement.name} - ${achievement.unlocked ? "Unlocked" : "In progress"}`,
      `${achievement.detail} Progress: ${Math.min(achievement.current, achievement.target)}/${achievement.target}.`,
      { fill: achievement.unlocked ? [255, 251, 235] : [248, 250, 252] },
    );
  });

  addSection(
    "Recent learning activity",
    "The latest 20 learning actions available when this report was generated.",
  );
  if (student.activityRows?.length) {
    student.activityRows.slice(0, 20).forEach((row) => {
      const result =
        typeof row.details?.correct === "boolean"
          ? row.details.correct
            ? " | Correct"
            : " | Incorrect"
          : "";
      addListItem(
        activityLabel(row.activity_type),
        `${row.chapter_slug ? `${readableSlug(row.chapter_slug)} | ` : ""}${formatLearningDate(row.created_at, true)}${result}`,
      );
    });
  } else {
    addListItem("No recent activity", "No learning activity has been recorded yet.");
  }

  addSection("Certificates");
  if (student.certificateRows?.length) {
    student.certificateRows.forEach((certificate) => {
      addListItem(
        `${certificate.task_name} - ${String(certificate.award_tier || "bronze").toUpperCase()}`,
        `${certificate.correct_answers}/${certificate.total_questions} correct | Issued ${formatLearningDate(certificate.issued_at)}`,
        { fill: [255, 251, 235] },
      );
    });
  } else {
    addListItem("No certificates yet", "No completion certificates have been earned.");
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, 284, PAGE_WIDTH - MARGIN, 284);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Confidential learning record", MARGIN, 289);
    doc.text(`Page ${page} of ${pageCount}`, PAGE_WIDTH - MARGIN, 289, {
      align: "right",
    });
  }

  return doc;
}

export async function downloadStudentReportPdf(student, improvementPlan) {
  const { jsPDF } = await import("jspdf");
  const doc = createStudentReportPdf(student, improvementPlan, jsPDF);
  doc.save(reportFileName(student.full_name));
}
