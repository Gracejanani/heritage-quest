import React, { useState } from "react";
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  ClipboardList,
  Clock3,
  Download,
  LockKeyhole,
  Medal,
  Star,
  Target,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";
import { AGE_GROUPS, calculateAge } from "../lib/age";
import {
  activityLabel,
  buildImprovementPlan,
  formatLearningDate,
  readableSlug,
  TOTAL_CHAPTERS,
} from "../lib/studentLearning";
import { downloadStudentReportPdf } from "../lib/studentReportPdf";
import { Badge, Button, ProgressBar, useToast } from "./ui";

export default function StudentLearningReport({ student, onReportDownloaded }) {
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);

  if (!student) return null;

  const ageInfo = AGE_GROUPS[student.age_group] || AGE_GROUPS.scholar;
  const age = calculateAge(student.dob);
  const improvementPlan = buildImprovementPlan(student);
  const progressPercent = Math.min(
    100,
    Math.round((student.completed / TOTAL_CHAPTERS) * 100),
  );

  const downloadReport = async () => {
    setDownloading(true);
    try {
      await downloadStudentReportPdf(student, improvementPlan);
      toast("Student report downloaded as a PDF.");
      try {
        await onReportDownloaded?.(student);
      } catch (logError) {
        console.error("Could not record the report download", logError);
      }
    } catch (downloadError) {
      console.error("Could not download the student report", downloadError);
      toast("Could not create the PDF report. Please try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-heritage-cream text-heritage-green">
              <UserRound className="h-8 w-8" />
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-heritage-green">
                Complete learning report
              </div>
              <h2 className="mt-1 font-display text-3xl font-extrabold text-slate-950">
                {student.full_name}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge>{ageInfo.label}</Badge>
                <Badge tone="blue">Age {age ?? "—"}</Badge>
                <Badge tone="gray">
                  {student.preferred_language || "English"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-sm font-semibold text-slate-500 sm:text-right">
            <div>DOB: {formatLearningDate(student.dob)}</div>
            <div className="mt-1">
              Joined: {formatLearningDate(student.created_at)}
            </div>
            <div className="mt-1">
              Last active: {formatLearningDate(student.lastActive, true)}
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4 w-full sm:w-auto"
              onClick={downloadReport}
              loading={downloading}
            >
              <Download className="h-4 w-4" />
              {downloading ? "Creating report…" : "Download PDF report"}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <DetailStat
            icon={BookOpen}
            label="Completed"
            value={`${student.completed}/${TOTAL_CHAPTERS}`}
          />
          <DetailStat icon={Trophy} label="Total score" value={student.totalScore} />
          <DetailStat icon={Zap} label="Total XP" value={student.totalXp} />
          <DetailStat icon={Target} label="Accuracy" value={`${student.accuracy}%`} />
          <DetailStat
            icon={Medal}
            label="Achievements"
            value={`${student.unlockedAchievements}/${student.achievements.length}`}
          />
          <DetailStat
            icon={Award}
            label="Certificates"
            value={student.certificateRows.length}
          />
        </div>
        <ProgressBar
          value={progressPercent}
          label="Overall chapter completion"
          className="mt-6"
        />
      </div>

      <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
              <ClipboardList className="h-5 w-5 text-heritage-green" />
              Recommended improvement plan
            </h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Practical next steps generated from this student&apos;s saved progress,
              accuracy, activity, and milestones.
            </p>
          </div>
          <Badge tone="green">{improvementPlan.length} focused actions</Badge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {improvementPlan.map((item, index) => (
            <article
              key={item.id}
              className="rounded-2xl border border-white bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-heritage-green text-sm font-extrabold text-white">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-extrabold text-slate-900">{item.title}</h4>
                    <Badge tone={item.tone}>{item.priority}</Badge>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {item.detail}
                  </p>
                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500">
                    Target: {item.goal}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-extrabold">Achievements & milestones</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              Live milestones calculated from saved progress and certificates.
            </p>
          </div>
          <Badge tone="gold">
            {student.unlockedAchievements}/{student.achievements.length} unlocked
          </Badge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {student.achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`rounded-2xl border p-4 ${
                achievement.unlocked
                  ? "border-amber-200 bg-amber-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    achievement.unlocked
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {achievement.unlocked ? (
                    <Star className="h-5 w-5" />
                  ) : (
                    <LockKeyhole className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-extrabold text-slate-900">
                      {achievement.name}
                    </h4>
                    {achievement.unlocked ? (
                      <Badge tone="gold">Unlocked</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    {achievement.detail}
                  </p>
                </div>
              </div>
              <ProgressBar value={achievement.progress} className="mt-4" />
              <div className="mt-2 text-xs font-bold text-slate-400">
                {Math.min(achievement.current, achievement.target)} / {achievement.target}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold">Chapter progress</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              Quiz score, accuracy, XP, completion, and last update.
            </p>
          </div>
          <BarChart3 className="h-6 w-6 text-heritage-green" />
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="pb-3">Chapter</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Score</th>
                <th className="pb-3">Accuracy</th>
                <th className="pb-3">XP</th>
                <th className="pb-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {student.progressRows.map((row) => (
                <tr key={row.chapter_slug} className="border-t border-slate-100">
                  <td className="py-3 pr-4 font-bold text-slate-800">
                    {readableSlug(row.chapter_slug)}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={row.finished ? "green" : "orange"}>
                      {row.finished ? "Completed" : "In progress"}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 font-extrabold text-heritage-green">
                    {Number(row.score || 0)}
                  </td>
                  <td className="py-3 pr-4">{row.accuracy}%</td>
                  <td className="py-3 pr-4">{Number(row.xp || 0)}</td>
                  <td className="py-3 text-xs text-slate-400">
                    {formatLearningDate(row.updated_at, true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!student.progressRows.length ? (
            <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
              This student has not started a quiz yet.
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold">Recent learning activity</h3>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Latest 20 recorded learning actions.
              </p>
            </div>
            <Activity className="h-5 w-5 text-sky-600" />
          </div>
          <div className="mt-4 grid max-h-[520px] gap-3 overflow-y-auto pr-1">
            {student.activityRows.slice(0, 20).map((row) => (
              <div key={row.id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-bold text-slate-800">
                        {activityLabel(row.activity_type)}
                      </div>
                      {typeof row.details?.correct === "boolean" ? (
                        <Badge tone={row.details.correct ? "green" : "red"}>
                          {row.details.correct ? "Correct" : "Incorrect"}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {row.chapter_slug
                        ? `${readableSlug(row.chapter_slug)} · `
                        : ""}
                      {formatLearningDate(row.created_at, true)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!student.activityRows.length ? (
              <p className="text-sm font-semibold text-slate-500">
                No learning activity recorded yet.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold">Certificates</h3>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Completion awards earned by this student.
              </p>
            </div>
            <Award className="h-5 w-5 text-amber-600" />
          </div>
          <div className="mt-4 grid max-h-[520px] gap-3 overflow-y-auto pr-1">
            {student.certificateRows.map((certificate) => (
              <div
                key={certificate.id}
                className="rounded-2xl border border-amber-100 bg-amber-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-extrabold text-slate-900">
                      {certificate.task_name}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      {certificate.correct_answers}/{certificate.total_questions} correct ·{" "}
                      {formatLearningDate(certificate.issued_at)}
                    </div>
                  </div>
                  <Badge tone="gold">
                    {String(certificate.award_tier || "bronze").toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
            {!student.certificateRows.length ? (
              <p className="text-sm font-semibold text-slate-500">
                No certificates earned yet.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function DetailStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <Icon className="h-5 w-5 text-heritage-green" />
      <div className="mt-3 text-xl font-extrabold text-slate-900">{value}</div>
      <div className="mt-1 text-xs font-bold text-slate-400">{label}</div>
    </div>
  );
}
