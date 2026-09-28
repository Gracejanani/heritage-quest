import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Award,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import StudentLearningReport from "../components/StudentLearningReport";
import { Badge, Button } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { AGE_GROUPS } from "../lib/age";
import { buildStudentReports } from "../lib/studentLearning";
import { supabase } from "../lib/supabase";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [progress, setProgress] = useState([]);
  const [activity, setActivity] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const writeTeacherActivity = useCallback(
    async (action, studentId = null, details = {}) => {
      if (!supabase || !user?.id) return;
      const { error: logError } = await supabase
        .from("teacher_activity_log")
        .insert({
          teacher_id: user.id,
          action,
          student_id: studentId,
          details,
        });
      if (logError) console.error("Could not log teacher activity", logError);
    },
    [user?.id],
  );

  const loadDashboard = useCallback(
    async (logAction = "dashboard_viewed") => {
      if (!supabase || !user?.id) return;
      setLoading(true);
      setError("");

      try {
        const [teacherResult, assignmentsResult] = await Promise.all([
          supabase
            .from("teacher_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("teacher_student_assignments")
            .select("student_id, assigned_at")
            .eq("teacher_id", user.id)
            .order("assigned_at", { ascending: false }),
        ]);

        if (teacherResult.error) throw teacherResult.error;
        if (assignmentsResult.error) throw assignmentsResult.error;

        const studentIds = (assignmentsResult.data || []).map(
          (row) => row.student_id,
        );
        setTeacher(teacherResult.data);

        if (!studentIds.length) {
          setProfiles([]);
          setProgress([]);
          setActivity([]);
          setCertificates([]);
          setSelectedStudentId("");
          await writeTeacherActivity(logAction, null, { assigned_students: 0 });
          return;
        }

        const [profilesResult, progressResult, activityResult, certificatesResult] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("*")
              .in("user_id", studentIds)
              .order("full_name"),
            supabase
              .from("quiz_progress")
              .select("*")
              .in("user_id", studentIds)
              .order("updated_at", { ascending: false }),
            supabase
              .from("activity_log")
              .select("*")
              .in("user_id", studentIds)
              .order("created_at", { ascending: false })
              .limit(500),
            supabase
              .from("certificates")
              .select("*")
              .in("user_id", studentIds)
              .order("issued_at", { ascending: false }),
          ]);

        const firstError = [
          profilesResult,
          progressResult,
          activityResult,
          certificatesResult,
        ].find((result) => result.error)?.error;
        if (firstError) throw firstError;

        const nextProfiles = profilesResult.data || [];
        setProfiles(nextProfiles);
        setProgress(progressResult.data || []);
        setActivity(activityResult.data || []);
        setCertificates(certificatesResult.data || []);
        setSelectedStudentId((current) =>
          studentIds.includes(current) ? current : nextProfiles[0]?.user_id || "",
        );
        await writeTeacherActivity(logAction, null, {
          assigned_students: nextProfiles.length,
        });
      } catch (loadError) {
        console.error("Could not load teacher dashboard", loadError);
        setError(loadError?.message || "Could not load the teacher dashboard.");
      } finally {
        setLoading(false);
      }
    },
    [user?.id, writeTeacherActivity],
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const studentRows = useMemo(
    () => buildStudentReports(profiles, progress, activity, certificates),
    [profiles, progress, activity, certificates],
  );

  const visibleStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return studentRows;
    return studentRows.filter((student) =>
      [student.full_name, student.age_group, student.preferred_language]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [studentRows, search]);

  const selectedStudent = studentRows.find(
    (student) => student.user_id === selectedStudentId,
  );

  const summary = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      students: studentRows.length,
      active: studentRows.filter(
        (student) =>
          student.lastActive && new Date(student.lastActive).getTime() >= weekAgo,
      ).length,
      completed: studentRows.reduce(
        (sum, student) => sum + student.completed,
        0,
      ),
      achievements: studentRows.reduce(
        (sum, student) => sum + student.unlockedAchievements,
        0,
      ),
      certificates: certificates.length,
    };
  }, [studentRows, certificates.length]);

  const openStudent = (studentId) => {
    setSelectedStudentId(studentId);
    writeTeacherActivity("student_details_viewed", studentId);
  };

  if (loading) {
    return (
      <div className="container-app py-20 text-center">
        <Loader2 className="mx-auto h-11 w-11 animate-spin text-heritage-green" />
        <p className="mt-4 font-bold text-slate-600">Loading teacher dashboard…</p>
      </div>
    );
  }

  return (
    <div className="container-app py-8 sm:py-10">
      <section className="overflow-hidden rounded-[2rem] bg-heritage-forest p-6 text-white sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-emerald-100">
              <GraduationCap className="h-4 w-4" /> Teacher dashboard
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold">
              Welcome, {teacher?.display_name || "Teacher"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
              View profiles, chapter progress, quiz performance, achievements,
              certificates, and recent activity for students assigned to you.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-white/70">
              {teacher?.school_name && (
                <span className="rounded-full bg-white/10 px-3 py-1.5">
                  {teacher.school_name}
                </span>
              )}
              {teacher?.subject && (
                <span className="rounded-full bg-white/10 px-3 py-1.5">
                  {teacher.subject}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => loadDashboard("dashboard_refreshed")}
          >
            <RefreshCw className="h-4 w-4" /> Refresh student data
          </Button>
        </div>
      </section>

      {error && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 font-semibold text-rose-700">
          {error}
        </div>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard icon={Users} label="Assigned students" value={summary.students} />
        <SummaryCard icon={Activity} label="Active this week" value={summary.active} tone="blue" />
        <SummaryCard icon={CheckCircle2} label="Chapters completed" value={summary.completed} tone="orange" />
        <SummaryCard icon={Trophy} label="Achievements unlocked" value={summary.achievements} tone="purple" />
        <SummaryCard icon={Award} label="Certificates earned" value={summary.certificates} tone="gold" />
      </section>

      {!studentRows.length ? (
        <section className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-2xl font-extrabold text-slate-800">
            No students assigned yet
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            An administrator can assign registered student accounts from the
            Admin → Teachers section.
          </p>
        </section>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold">My students</h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Select a student to inspect their learning record.
                </p>
              </div>
              <Badge>{visibleStudents.length}</Badge>
            </div>
            <label className="relative mt-5 block">
              <span className="sr-only">Search students</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or age group…"
                className="focus-ring h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none"
              />
            </label>
            <div className="mt-4 grid max-h-[680px] gap-3 overflow-y-auto pr-1">
              {visibleStudents.map((student) => {
                const selected = student.user_id === selectedStudentId;
                const ageInfo = AGE_GROUPS[student.age_group] || AGE_GROUPS.scholar;
                return (
                  <button
                    key={student.user_id}
                    type="button"
                    onClick={() => openStudent(student.user_id)}
                    className={`focus-ring rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-emerald-300 bg-emerald-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-heritage-cream text-heritage-green">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-extrabold text-slate-900">
                          {student.full_name}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-400">
                          {ageInfo.label} · {student.completed}/12 completed
                        </div>
                      </div>
                      <ChevronRight className="mt-2 h-4 w-4 text-slate-400" />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <MiniStat label="Score" value={student.totalScore} />
                      <MiniStat label="Accuracy" value={`${student.accuracy}%`} />
                      <MiniStat
                        label="Achievements"
                        value={`${student.unlockedAchievements}/${student.achievements.length}`}
                      />
                    </div>
                  </button>
                );
              })}
              {!visibleStudents.length && (
                <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
                  No students match this search.
                </p>
              )}
            </div>
          </section>

          {selectedStudent && <StudentLearningReport student={selectedStudent} />}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, tone = "green" }) {
  const tones = {
    green: "bg-emerald-50 text-heritage-green",
    blue: "bg-sky-50 text-sky-700",
    orange: "bg-orange-50 text-orange-700",
    purple: "bg-violet-50 text-violet-700",
    gold: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-3xl font-extrabold text-slate-950">{value}</div>
      <div className="mt-1 text-sm font-bold text-slate-500">{label}</div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/80 p-2">
      <div className="font-extrabold text-slate-800">{value}</div>
      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </div>
    </div>
  );
}
