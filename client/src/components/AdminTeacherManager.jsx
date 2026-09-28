import React, { useMemo, useState } from "react";
import {
  Activity,
  BookOpenCheck,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  School,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge, Button, Modal, useToast } from "./ui";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const inputClass =
  "focus-ring w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none";
const labelClass =
  "mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function readableAction(value = "") {
  return String(value)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AdminTeacherManager({
  profiles,
  teachers,
  assignments,
  activityRows,
  adminUsers,
  onRefresh,
  audit,
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [teacherForm, setTeacherForm] = useState(null);
  const [studentSelections, setStudentSelections] = useState({});
  const [activityTeacher, setActivityTeacher] = useState("all");
  const [saving, setSaving] = useState(false);

  const profileMap = useMemo(
    () => new Map(profiles.map((profile) => [profile.user_id, profile])),
    [profiles],
  );
  const teacherMap = useMemo(
    () => new Map(teachers.map((teacher) => [teacher.user_id, teacher])),
    [teachers],
  );
  const teacherIds = useMemo(
    () => new Set(teachers.map((teacher) => teacher.user_id)),
    [teachers],
  );
  const adminIds = useMemo(
    () => new Set(adminUsers.map((admin) => admin.user_id)),
    [adminUsers],
  );

  const availableTeacherAccounts = useMemo(
    () =>
      profiles.filter(
        (profile) =>
          !teacherIds.has(profile.user_id) && !adminIds.has(profile.user_id),
      ),
    [profiles, teacherIds, adminIds],
  );

  const teacherRows = useMemo(
    () =>
      teachers
        .map((teacher) => {
          const teacherAssignments = assignments.filter(
            (row) => row.teacher_id === teacher.user_id,
          );
          const latestActivity = activityRows.find(
            (row) => row.teacher_id === teacher.user_id,
          );
          return { ...teacher, teacherAssignments, latestActivity };
        })
        .sort((a, b) => a.display_name.localeCompare(b.display_name)),
    [teachers, assignments, activityRows],
  );

  const filteredActivity = useMemo(
    () =>
      activityTeacher === "all"
        ? activityRows
        : activityRows.filter((row) => row.teacher_id === activityTeacher),
    [activityRows, activityTeacher],
  );

  const openCreateTeacher = () => {
    const account = availableTeacherAccounts[0];
    setTeacherForm({
      mode: "create",
      user_id: account?.user_id || "",
      display_name: account?.full_name || "",
      school_name: "",
      subject: "Indian Heritage",
      status: "active",
    });
  };

  const chooseTeacherAccount = (userId) => {
    const account = profileMap.get(userId);
    setTeacherForm((current) => ({
      ...current,
      user_id: userId,
      display_name: account?.full_name || current?.display_name || "",
    }));
  };

  const saveTeacher = async () => {
    if (!teacherForm?.user_id || !teacherForm.display_name.trim()) {
      toast("Choose an account and enter the teacher's name.", "error");
      return;
    }

    setSaving(true);
    const payload = {
      display_name: teacherForm.display_name.trim(),
      school_name: teacherForm.school_name.trim() || null,
      subject: teacherForm.subject.trim() || null,
      status: teacherForm.status,
      updated_at: new Date().toISOString(),
    };

    const result =
      teacherForm.mode === "create"
        ? await supabase.from("teacher_profiles").insert({
            ...payload,
            user_id: teacherForm.user_id,
            created_by: user?.id || null,
          })
        : await supabase
            .from("teacher_profiles")
            .update(payload)
            .eq("user_id", teacherForm.user_id);

    setSaving(false);
    if (result.error) {
      toast(result.error.message, "error");
      return;
    }

    await audit(
      teacherForm.mode === "create" ? "create" : "update",
      "teacher_profile",
      teacherForm.user_id,
      { status: teacherForm.status },
    );
    toast(
      teacherForm.mode === "create"
        ? "Teacher access activated."
        : "Teacher profile updated.",
    );
    setTeacherForm(null);
    await onRefresh();
  };

  const assignStudent = async (teacherId) => {
    const studentId = studentSelections[teacherId];
    if (!studentId) {
      toast("Choose a student to assign.", "error");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("teacher_student_assignments")
      .insert({
        teacher_id: teacherId,
        student_id: studentId,
        assigned_by: user?.id || null,
      });
    setSaving(false);

    if (error) {
      toast(error.message, "error");
      return;
    }

    await audit("assign", "teacher_student", `${teacherId}:${studentId}`);
    toast("Student assigned to teacher.");
    setStudentSelections((current) => ({ ...current, [teacherId]: "" }));
    await onRefresh();
  };

  const removeAssignment = async (teacherId, studentId) => {
    setSaving(true);
    const { error } = await supabase
      .from("teacher_student_assignments")
      .delete()
      .eq("teacher_id", teacherId)
      .eq("student_id", studentId);
    setSaving(false);

    if (error) {
      toast(error.message, "error");
      return;
    }

    await audit("unassign", "teacher_student", `${teacherId}:${studentId}`);
    toast("Student removed from teacher.");
    await onRefresh();
  };

  return (
    <section className="mt-6 space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h2 className="text-2xl font-extrabold">Teacher management</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Activate teacher accounts, assign registered students, control access,
            and monitor teacher dashboard activity.
          </p>
        </div>
        <Button
          onClick={openCreateTeacher}
          disabled={!availableTeacherAccounts.length}
        >
          <UserPlus className="h-4 w-4" /> Add teacher
        </Button>
      </div>

      {!availableTeacherAccounts.length && !teachers.length && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          A teacher must first register a normal Heritage Quest account. Their
          account will then appear here for activation.
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        {teacherRows.map((teacher) => {
          const assignedIds = new Set(
            teacher.teacherAssignments.map((row) => row.student_id),
          );
          const availableStudents = profiles.filter(
            (profile) =>
              !teacherIds.has(profile.user_id) &&
              !adminIds.has(profile.user_id) &&
              !assignedIds.has(profile.user_id),
          );

          return (
            <article
              key={teacher.user_id}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-heritage-green">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-extrabold text-slate-900">
                      {teacher.display_name}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge tone={teacher.status === "active" ? "green" : "red"}>
                        {teacher.status}
                      </Badge>
                      {teacher.subject && <Badge tone="blue">{teacher.subject}</Badge>}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTeacherForm({ ...teacher, mode: "edit" })}
                  className="focus-ring rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-emerald-50 hover:text-heritage-green"
                  aria-label={`Edit ${teacher.display_name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Users className="h-4 w-4 text-heritage-green" />
                    {teacher.teacherAssignments.length} students
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Activity className="h-4 w-4 text-sky-600" />
                    {teacher.latestActivity
                      ? formatDate(teacher.latestActivity.created_at)
                      : "No activity"}
                  </div>
                </div>
              </div>

              {teacher.school_name && (
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <School className="h-4 w-4" /> {teacher.school_name}
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                  Assigned students
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {teacher.teacherAssignments.map((assignment) => {
                    const student = profileMap.get(assignment.student_id);
                    return (
                      <span
                        key={assignment.student_id}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800"
                      >
                        {student?.full_name || "Registered student"}
                        <button
                          type="button"
                          onClick={() =>
                            removeAssignment(teacher.user_id, assignment.student_id)
                          }
                          disabled={saving}
                          className="rounded-full text-emerald-700 hover:text-rose-600"
                          aria-label={`Remove ${student?.full_name || "student"}`}
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    );
                  })}
                  {!teacher.teacherAssignments.length && (
                    <span className="text-sm font-semibold text-slate-400">
                      No students assigned.
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <select
                    value={studentSelections[teacher.user_id] || ""}
                    onChange={(event) =>
                      setStudentSelections((current) => ({
                        ...current,
                        [teacher.user_id]: event.target.value,
                      }))
                    }
                    className={`${inputClass} flex-1`}
                    aria-label={`Assign student to ${teacher.display_name}`}
                  >
                    <option value="">Choose a student…</option>
                    {availableStudents.map((student) => (
                      <option key={student.user_id} value={student.user_id}>
                        {student.full_name} · {student.age_group}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => assignStudent(teacher.user_id)}
                    disabled={saving || !availableStudents.length}
                  >
                    <Plus className="h-4 w-4" /> Assign
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!teacherRows.length && (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-xl font-extrabold text-slate-800">
            No teacher accounts activated
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Use Add teacher after the teacher has registered an account.
          </p>
        </div>
      )}

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h3 className="text-xl font-extrabold">Teacher activity</h3>
            <p className="mt-1 text-sm text-slate-500">
              Dashboard visits, refreshes, and student-detail views are recorded here.
            </p>
          </div>
          <select
            value={activityTeacher}
            onChange={(event) => setActivityTeacher(event.target.value)}
            className={`${inputClass} sm:w-64`}
            aria-label="Filter teacher activity"
          >
            <option value="all">All teachers</option>
            {teacherRows.map((teacher) => (
              <option key={teacher.user_id} value={teacher.user_id}>
                {teacher.display_name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[820px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="rounded-l-xl px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Student</th>
                <th className="rounded-r-xl px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivity.slice(0, 100).map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-4 font-extrabold text-slate-800">
                    {teacherMap.get(row.teacher_id)?.display_name || "Teacher"}
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone="blue">{readableAction(row.action)}</Badge>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-600">
                    {row.student_id
                      ? profileMap.get(row.student_id)?.full_name || "Assigned student"
                      : "—"}
                  </td>
                  <td className="px-4 py-4 text-xs font-semibold text-slate-400">
                    {formatDate(row.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredActivity.length && (
            <div className="py-10 text-center text-sm font-semibold text-slate-500">
              No teacher dashboard activity recorded yet.
            </div>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(teacherForm)}
        onClose={() => !saving && setTeacherForm(null)}
        title={teacherForm?.mode === "create" ? "Activate teacher account" : "Edit teacher"}
      >
        {teacherForm && (
          <div className="space-y-4">
            {teacherForm.mode === "create" && (
              <div>
                <label className={labelClass}>Registered account</label>
                <select
                  value={teacherForm.user_id}
                  onChange={(event) => chooseTeacherAccount(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Choose an account…</option>
                  {availableTeacherAccounts.map((profile) => (
                    <option key={profile.user_id} value={profile.user_id}>
                      {profile.full_name} · {profile.age_group}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={labelClass}>Teacher name</label>
              <input
                className={inputClass}
                value={teacherForm.display_name}
                onChange={(event) =>
                  setTeacherForm((current) => ({
                    ...current,
                    display_name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>School / institution</label>
                <input
                  className={inputClass}
                  value={teacherForm.school_name || ""}
                  onChange={(event) =>
                    setTeacherForm((current) => ({
                      ...current,
                      school_name: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Subject / department</label>
                <input
                  className={inputClass}
                  value={teacherForm.subject || ""}
                  onChange={(event) =>
                    setTeacherForm((current) => ({
                      ...current,
                      subject: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Access status</label>
              <select
                className={inputClass}
                value={teacherForm.status}
                onChange={(event) =>
                  setTeacherForm((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              <BookOpenCheck className="mr-2 inline h-4 w-4 text-heritage-green" />
              Active teachers can only view students assigned by an administrator.
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setTeacherForm(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={saveTeacher} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {teacherForm.mode === "create" ? "Activate teacher" : "Save changes"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
