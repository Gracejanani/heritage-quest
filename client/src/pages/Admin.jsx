import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Award,
  BookOpen,
  Check,
  Database,
  FileImage,
  Gamepad2,
  ImagePlus,
  LayoutDashboard,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  Type,
  Users,
  X,
} from "lucide-react";
import { Badge, Button, Select, useToast } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const tabs = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["questions", "Questions", BookOpen],
  ["word-puzzles", "Word game", Type],
  ["games", "Games", Gamepad2],
  ["chapters", "Chapters", Database],
  ["students", "Students", Users],
  ["certificates", "Certificates", Award],
  ["assets", "Images & files", FileImage],
  ["settings", "Site settings", Settings],
  ["audit", "Admin activity", Activity],
];

const inputClass =
  "focus-ring w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none";
const labelClass =
  "mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500";

function lines(value) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function textLines(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function safeFileName(name) {
  return String(name || "asset")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export default function Admin() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState("dashboard");
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [games, setGames] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [wordPuzzles, setWordPuzzles] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [progress, setProgress] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [auditRows, setAuditRows] = useState([]);
  const [settingsRow, setSettingsRow] = useState({ id: "main", payload: {} });
  const [assets, setAssets] = useState([]);

  const [questionSearch, setQuestionSearch] = useState("");
  const [questionChapter, setQuestionChapter] = useState("All");
  const [questionAge, setQuestionAge] = useState("All");
  const [questionForm, setQuestionForm] = useState(null);
  const [wordPuzzleAge, setWordPuzzleAge] = useState("All");
  const [wordPuzzleForm, setWordPuzzleForm] = useState(null);
  const [gameForm, setGameForm] = useState(null);
  const [chapterForm, setChapterForm] = useState(null);
  const [studentForm, setStudentForm] = useState(null);
  const [settingsForm, setSettingsForm] = useState({});

  const audit = async (action, entityType, entityId, details = {}) => {
    if (!supabase || !user?.id) return;
    const { error } = await supabase.from("admin_audit_log").insert({
      admin_user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId ? String(entityId) : null,
      details,
    });
    if (error) console.error("Could not write admin audit log", error);
  };

  const loadAssets = async () => {
    if (!supabase) return;

    const folders = ["", "admin", "games", "chapters", "site", "test-videos"];
    const results = await Promise.all(
      folders.map(async (folder) => {
        const { data, error } = await supabase.storage
          .from("game-images")
          .list(folder, {
            limit: 100,
            sortBy: { column: "created_at", order: "desc" },
          });

        if (error) {
          console.error(error);
          return [];
        }

        return (data || [])
          .filter((item) => item.id || item.metadata)
          .map((item) => ({
            ...item,
            path: folder ? `${folder}/${item.name}` : item.name,
          }));
      }),
    );

    setAssets(results.flat());
  };

  const refreshAll = async () => {
    if (!supabase) return;
    setBusy(true);

    const [
      gamesRes,
      chaptersRes,
      questionsRes,
      wordPuzzlesRes,
      profilesRes,
      progressRes,
      certificatesRes,
      settingsRes,
      auditRes,
    ] = await Promise.all([
      supabase
        .from("games")
        .select("*")
        .order("display_order", { ascending: true })
        .order("title", { ascending: true }),
      supabase.from("chapters").select("*").order("title"),
      supabase
        .from("questions")
        .select("*")
        .order("chapter_slug")
        .order("age_group")
        .order("sort_order"),
      supabase
        .from("word_puzzles")
        .select("*")
        .order("age_group")
        .order("sort_order"),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("quiz_progress").select("*"),
      supabase
        .from("certificates")
        .select("*")
        .order("issued_at", { ascending: false }),
      supabase.from("site_settings").select("*").eq("id", "main").maybeSingle(),
      supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const firstError = [
      gamesRes,
      chaptersRes,
      questionsRes,
      wordPuzzlesRes,
      profilesRes,
      progressRes,
      certificatesRes,
      settingsRes,
      auditRes,
    ].find((result) => result.error)?.error;

    if (firstError) {
      console.error(firstError);
      toast(firstError.message || "Could not load admin data.", "error");
    }

    setGames(gamesRes.data || []);
    setChapters(chaptersRes.data || []);
    setQuestions(questionsRes.data || []);
    setWordPuzzles(wordPuzzlesRes.data || []);
    setProfiles(profilesRes.data || []);
    setProgress(progressRes.data || []);
    setCertificates(certificatesRes.data || []);

    const nextSettings = settingsRes.data || { id: "main", payload: {} };
    setSettingsRow(nextSettings);
    setSettingsForm(nextSettings.payload || {});
    setAuditRows(auditRes.data || []);

    await loadAssets();
    setBusy(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const uploadAsset = async (file, folder = "admin") => {
    if (!file || !supabase) return null;
    const path = `${folder}/${Date.now()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage
      .from("game-images")
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type || undefined,
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage.from("game-images").getPublicUrl(path);
    await audit("upload", "asset", path, { contentType: file.type, size: file.size });
    await loadAssets();
    return data.publicUrl;
  };

  const filteredQuestions = useMemo(() => {
    const query = questionSearch.trim().toLowerCase();
    return questions.filter((item) => {
      const matchSearch =
        !query ||
        `${item.id} ${item.question} ${item.explanation || ""}`
          .toLowerCase()
          .includes(query);
      const matchChapter =
        questionChapter === "All" || item.chapter_slug === questionChapter;
      const matchAge = questionAge === "All" || item.age_group === questionAge;
      return matchSearch && matchChapter && matchAge;
    });
  }, [questions, questionSearch, questionChapter, questionAge]);

  const studentRows = useMemo(
    () =>
      profiles.map((profile) => {
        const rows = progress.filter((item) => item.user_id === profile.user_id);
        const totalScore = rows.reduce(
          (sum, item) => sum + Number(item.score || 0),
          0,
        );
        const completed = rows.filter((item) => item.finished).length;
        const certificateCount = certificates.filter(
          (item) => item.user_id === profile.user_id,
        ).length;
        return { ...profile, totalScore, completed, certificateCount };
      }),
    [profiles, progress, certificates],
  );

  const saveQuestion = async () => {
    if (!questionForm || !supabase) return;
    if (
      !questionForm.id ||
      !questionForm.chapter_slug ||
      !questionForm.question ||
      questionForm.answers.some((answer) => !String(answer).trim())
    ) {
      toast("Complete the question, chapter and all four answer choices.", "error");
      return;
    }

    setSaving(true);
    const payload = {
      id: questionForm.id.trim(),
      chapter_slug: questionForm.chapter_slug,
      age_group: questionForm.age_group,
      difficulty: questionForm.difficulty,
      question: questionForm.question.trim(),
      answers: questionForm.answers.map((answer) => answer.trim()),
      correct_index: Number(questionForm.correct_index),
      explanation: questionForm.explanation || null,
      hint: questionForm.hint || null,
      sort_order: Number(questionForm.sort_order || 0),
      source_label: questionForm.source_label || "Admin CMS",
    };

    const { error } = await supabase
      .from("questions")
      .upsert(payload, { onConflict: "id,age_group" });

    setSaving(false);
    if (error) {
      toast(error.message, "error");
      return;
    }

    await audit("save", "question", `${payload.id}:${payload.age_group}`, {
      chapter: payload.chapter_slug,
    });
    toast("Question saved.");
    setQuestionForm(null);
    await refreshAll();
  };

  const deleteQuestion = async (item) => {
    if (!window.confirm(`Delete “${item.question}”?`)) return;
    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", item.id)
      .eq("age_group", item.age_group);

    if (error) {
      toast(error.message, "error");
      return;
    }

    await audit("delete", "question", `${item.id}:${item.age_group}`);
    toast("Question deleted.");
    await refreshAll();
  };

  const openQuestion = (item = null) => {
    setQuestionForm(
      item
        ? {
            ...item,
            answers: Array.isArray(item.answers)
              ? [...item.answers]
              : ["", "", "", ""],
            isExisting: true,
          }
        : {
            id: `custom-${Date.now()}`,
            chapter_slug: chapters[0]?.slug || "",
            age_group: "all",
            difficulty: "Medium",
            question: "",
            answers: ["", "", "", ""],
            correct_index: 0,
            explanation: "",
            hint: "",
            sort_order: 10,
            source_label: "Admin CMS",
            isExisting: false,
          },
    );
  };


  const openWordPuzzle = (item = null) => {
    setWordPuzzleForm(
      item
        ? { ...item, isExisting: true }
        : {
            id: `word-${Date.now()}`,
            game_slug: "heritage-word-quest",
            age_group: "entry",
            difficulty: "Entry",
            clue: "",
            answer: "",
            hint: "",
            explanation: "",
            sort_order: 10,
            isExisting: false,
          },
    );
  };

  const saveWordPuzzle = async () => {
    if (!wordPuzzleForm || !supabase) return;

    const answer = String(wordPuzzleForm.answer || "").trim().toUpperCase();
    const clue = String(wordPuzzleForm.clue || "").trim();

    if (!wordPuzzleForm.id || !clue || !answer) {
      toast("Clue, answer and puzzle ID are required.", "error");
      return;
    }

    setSaving(true);

    const record = {
      id: wordPuzzleForm.id.trim(),
      game_slug: "heritage-word-quest",
      age_group: wordPuzzleForm.age_group,
      difficulty: wordPuzzleForm.difficulty,
      clue,
      answer,
      hint: wordPuzzleForm.hint || null,
      explanation: wordPuzzleForm.explanation || null,
      sort_order: Number(wordPuzzleForm.sort_order || 0),
      updated_at: new Date().toISOString(),
    };

    const query = wordPuzzleForm.isExisting
      ? supabase
          .from("word_puzzles")
          .update(record)
          .eq("id", wordPuzzleForm.id)
      : supabase.from("word_puzzles").insert(record);

    const { error } = await query;
    setSaving(false);

    if (error) {
      toast(error.message, "error");
      return;
    }

    await audit(
      wordPuzzleForm.isExisting ? "update" : "create",
      "word_puzzle",
      record.id,
      { ageGroup: record.age_group },
    );
    toast(
      wordPuzzleForm.isExisting
        ? "Word puzzle updated."
        : "Word puzzle created.",
    );
    setWordPuzzleForm(null);
    await refreshAll();
  };

  const deleteWordPuzzle = async (item) => {
    if (!window.confirm(`Delete word puzzle “${item.clue}”?`)) return;

    const { error } = await supabase
      .from("word_puzzles")
      .delete()
      .eq("id", item.id);

    if (error) {
      toast(error.message, "error");
      return;
    }

    await audit("delete", "word_puzzle", item.id);
    toast("Word puzzle deleted.");
    await refreshAll();
  };

  const openGame = (row) => {
    const payload = row.payload || {};
    setGameForm({
      ...row,
      chapterSlug: payload.chapterSlug || "",
      description: payload.description || "",
      longDescription: payload.longDescription || "",
      image: payload.image || "",
      testVideo: payload.testVideo || "",
      players: payload.players || "1 Player",
      time: payload.time || "5–10 min",
      learnText: textLines(payload.learn),
      achievementsText: textLines(payload.achievements),
      display_order: Number(row.display_order || 999),
      isExisting: true,
    });
  };

  const createGame = () => {
    setGameForm({
      id: "",
      slug: "",
      title: "",
      category: "History",
      difficulty: "Medium",
      chapterSlug: chapters[0]?.slug || "",
      description: "",
      longDescription: "",
      image: "",
      testVideo: "",
      players: "1 Player",
      time: "5–10 min",
      learnText: "",
      achievementsText: "",
      display_order:
        Math.max(
          0,
          ...games
            .filter((item) => item.slug !== "heritage-word-quest")
            .map((item) => Number(item.display_order || 0)),
        ) + 1,
      isExisting: false,
    });
  };

  const saveGame = async () => {
    if (!gameForm) return;

    const id = slugify(gameForm.id || gameForm.title);
    const slug = slugify(gameForm.slug || gameForm.title);

    if (!id || !slug || !gameForm.title.trim()) {
      toast("Game title, ID and URL slug are required.", "error");
      return;
    }

    if (!gameForm.isExisting) {
      const duplicate = games.some(
        (item) => item.id === id || item.slug === slug,
      );
      if (duplicate) {
        toast("A game with this ID or URL slug already exists.", "error");
        return;
      }
    }

    setSaving(true);
    const current = games.find((item) => item.id === gameForm.id);
    const payload = {
      ...(current?.payload || {}),
      chapterSlug: gameForm.chapterSlug,
      description: gameForm.description,
      longDescription: gameForm.longDescription,
      image: gameForm.image,
      testVideo: gameForm.testVideo || "",
      players: gameForm.players,
      time: gameForm.time,
      learn: lines(gameForm.learnText),
      achievements: lines(gameForm.achievementsText),
    };

    const gameRecord = {
      id,
      slug,
      title: gameForm.title.trim(),
      category: gameForm.category,
      difficulty: gameForm.difficulty,
      display_order: Number(gameForm.display_order || 999),
      payload,
      updated_at: new Date().toISOString(),
    };

    const query = gameForm.isExisting
      ? supabase.from("games").update(gameRecord).eq("id", gameForm.id)
      : supabase.from("games").insert(gameRecord);

    const { error } = await query;

    setSaving(false);
    if (error) {
      toast(error.message, "error");
      return;
    }

    await audit(
      gameForm.isExisting ? "update" : "create",
      "game",
      id,
      { slug },
    );
    toast(gameForm.isExisting ? "Game updated." : "New game created.");
    setGameForm(null);
    await refreshAll();
  };

  const moveGamePosition = async (gameId, newPosition) => {
    if (!supabase) return;

    const target = Math.max(1, Number(newPosition || 1));
    setSaving(true);

    const { error } = await supabase.rpc("move_game_position", {
      p_game_id: gameId,
      p_new_position: target,
    });

    setSaving(false);

    if (error) {
      toast(error.message || "Could not change game position.", "error");
      return;
    }

    await audit("reorder", "game", gameId, { position: target });
    toast(`Game moved to position ${target}.`);
    await refreshAll();
  };

  const openChapter = (row) => {
    const payload = row.payload || {};
    setChapterForm({
      ...row,
      image: payload.image || "",
      testVideo: payload.testVideo || "",
      learnText: textLines(payload.learn),
      sectionsJson: JSON.stringify(payload.sections || [], null, 2),
      isExisting: true,
    });
  };

  const createChapter = () => {
    setChapterForm({
      slug: "",
      title: "",
      description: "",
      era: "",
      tag: "Heritage",
      image: "",
      testVideo: "",
      learnText: "",
      sectionsJson: "[]",
      isExisting: false,
    });
  };

  const saveChapter = async () => {
    if (!chapterForm) return;

    const slug = slugify(chapterForm.slug || chapterForm.title);
    if (!slug || !chapterForm.title.trim()) {
      toast("Chapter title and slug are required.", "error");
      return;
    }

    if (
      !chapterForm.isExisting &&
      chapters.some((item) => item.slug === slug)
    ) {
      toast("A chapter with this slug already exists.", "error");
      return;
    }

    let sections = [];
    try {
      sections = chapterForm.sectionsJson.trim()
        ? JSON.parse(chapterForm.sectionsJson)
        : [];
    } catch {
      toast("Sections JSON is not valid.", "error");
      return;
    }

    setSaving(true);
    const current = chapters.find((item) => item.slug === chapterForm.slug);
    const payload = {
      ...(current?.payload || {}),
      image: chapterForm.image,
      testVideo: chapterForm.testVideo || "",
      learn: lines(chapterForm.learnText),
      sections,
    };

    const chapterRecord = {
      slug,
      title: chapterForm.title.trim(),
      description: chapterForm.description,
      era: chapterForm.era,
      tag: chapterForm.tag,
      payload,
      updated_at: new Date().toISOString(),
    };

    const query = chapterForm.isExisting
      ? supabase
          .from("chapters")
          .update(chapterRecord)
          .eq("slug", chapterForm.slug)
      : supabase.from("chapters").insert(chapterRecord);

    const { error } = await query;

    setSaving(false);
    if (error) {
      toast(error.message, "error");
      return;
    }

    await audit(
      chapterForm.isExisting ? "update" : "create",
      "chapter",
      slug,
    );
    toast(
      chapterForm.isExisting ? "Chapter updated." : "New chapter created.",
    );
    setChapterForm(null);
    await refreshAll();
  };

  const saveStudent = async () => {
    if (!studentForm) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: studentForm.full_name,
        dob: studentForm.dob,
        age_group: studentForm.age_group,
        preferred_language: studentForm.preferred_language,
        leaderboard_opt_in: Boolean(studentForm.leaderboard_opt_in),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", studentForm.user_id);

    setSaving(false);
    if (error) {
      toast(error.message, "error");
      return;
    }
    await audit("update", "student_profile", studentForm.user_id);
    toast("Student profile updated.");
    setStudentForm(null);
    await refreshAll();
  };

  const resetStudent = async (profile) => {
    if (
      !window.confirm(
        `Reset all quiz progress, activity and certificates for ${profile.full_name}? This cannot be undone.`,
      )
    )
      return;

    setSaving(true);
    const results = await Promise.all([
      supabase.from("quiz_progress").delete().eq("user_id", profile.user_id),
      supabase.from("activity_log").delete().eq("user_id", profile.user_id),
      supabase.from("certificates").delete().eq("user_id", profile.user_id),
    ]);
    setSaving(false);

    const error = results.find((item) => item.error)?.error;
    if (error) {
      toast(error.message, "error");
      return;
    }

    await audit("reset_learning", "student_profile", profile.user_id);
    toast("Student learning data reset.");
    await refreshAll();
  };

  const deleteCertificate = async (certificate) => {
    if (!window.confirm(`Delete certificate ${certificate.verification_code}?`))
      return;

    if (certificate.storage_path) {
      await supabase.storage
        .from("certificates")
        .remove([certificate.storage_path]);
    }

    const { error } = await supabase
      .from("certificates")
      .delete()
      .eq("id", certificate.id);

    if (error) {
      toast(error.message, "error");
      return;
    }
    await audit("delete", "certificate", certificate.id);
    toast("Certificate deleted.");
    await refreshAll();
  };

  const saveSettings = async () => {
    setSaving(true);
    const payload = {
      ...settingsForm,
      dailyChallengeQuestions: Math.max(
        1,
        Number(settingsForm.dailyChallengeQuestions || 5),
      ),
      weeklyGoalPoints: Math.max(1, Number(settingsForm.weeklyGoalPoints || 700)),
    };

    const { error } = await supabase.from("site_settings").upsert({
      id: "main",
      payload,
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    });

    setSaving(false);
    if (error) {
      toast(error.message, "error");
      return;
    }

    await audit("update", "site_settings", "main");
    toast("Website settings updated.");
    setSettingsRow({ id: "main", payload });
    await refreshAll();
  };

  const removeAsset = async (asset) => {
    if (!window.confirm(`Delete ${asset.path || asset.name} from Supabase Storage?`)) return;
    const { error } = await supabase.storage
      .from("game-images")
      .remove([asset.path || asset.name]);
    if (error) {
      toast(error.message, "error");
      return;
    }
    await audit("delete", "asset", asset.path || asset.name);
    toast("Asset deleted.");
    await loadAssets();
  };

  const dashboardCards = [
    ["Students", profiles.length, Users],
    ["Questions", questions.length + wordPuzzles.length, BookOpen],
    ["Games", games.length, Gamepad2],
    ["Certificates", certificates.length, Award],
  ];

  if (busy) {
    return (
      <div className="container-app py-20 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-heritage-green" />
        <p className="mt-4 font-bold text-slate-600">Loading Heritage Quest admin…</p>
      </div>
    );
  }

  return (
    <div className="container-app py-8 sm:py-10">
      <section className="rounded-[2rem] bg-heritage-forest p-6 text-white sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold text-emerald-100">
              <ShieldCheck className="h-4 w-4" /> SECURE ADMIN CMS
            </div>
            <h1 className="mt-3 font-display text-4xl font-extrabold">
              Heritage Quest Administration
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
              Manage questions, games, learning chapters, images, student records,
              certificates and website content directly in Supabase.
            </p>
          </div>
          <Button variant="outline" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4" /> Refresh data
          </Button>
        </div>
      </section>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {tabs.map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`focus-ring inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold transition ${
              tab === id
                ? "bg-heritage-green text-white shadow-soft"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <section className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map(([label, value, Icon]) => (
              <div key={label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <Icon className="h-7 w-7 text-heritage-green" />
                <div className="mt-4 text-3xl font-extrabold text-slate-950">{value}</div>
                <div className="mt-1 text-sm font-bold text-slate-500">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-extrabold">Content overview</h2>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="font-extrabold">{chapters.length}</div>
                  <div className="text-slate-500">Learning chapters</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="font-extrabold">{progress.length}</div>
                  <div className="text-slate-500">Saved progress rows</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="font-extrabold">
                    {questions.filter((q) => q.age_group === "entry").length}
                  </div>
                  <div className="text-slate-500">Entry questions</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="font-extrabold">
                    {questions.filter((q) => q.age_group === "junior").length}
                  </div>
                  <div className="text-slate-500">Junior questions</div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-extrabold">Recent admin changes</h2>
              <div className="mt-4 grid gap-3">
                {auditRows.slice(0, 6).map((row) => (
                  <div key={row.id} className="rounded-2xl bg-slate-50 p-3 text-sm">
                    <div className="font-bold text-slate-800">
                      {row.action} · {row.entity_type}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {row.entity_id || "—"} · {new Date(row.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
                {!auditRows.length && (
                  <p className="text-sm text-slate-500">No admin changes logged yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === "questions" && (
        <section className="mt-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h2 className="text-2xl font-extrabold">Question manager</h2>
              <p className="mt-1 text-sm text-slate-500">
                Edit question text, choices, correct answers, hints, explanations and difficulty.
              </p>
            </div>
            <Button onClick={() => openQuestion()}>
              <Plus className="h-4 w-4" /> Add question
            </Button>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_240px_180px]">
            <input
              className={inputClass}
              value={questionSearch}
              onChange={(e) => setQuestionSearch(e.target.value)}
              placeholder="Search questions…"
            />
            <Select
              value={questionChapter}
              onChange={setQuestionChapter}
              options={["All", ...chapters.map((item) => item.slug)]}
            />
            <Select
              value={questionAge}
              onChange={setQuestionAge}
              options={["All", "all", "entry", "junior", "scholar", "open"]}
            />
          </div>
          <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-200 bg-white">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Question</th>
                  <th className="px-4 py-3">Chapter</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">Correct</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((item) => (
                  <tr key={`${item.id}-${item.age_group}`} className="border-t border-slate-100">
                    <td className="max-w-xl px-4 py-4 font-semibold text-slate-800">
                      {item.question}
                    </td>
                    <td className="px-4 py-4 text-slate-500">{item.chapter_slug}</td>
                    <td className="px-4 py-4"><Badge tone="gray">{item.age_group}</Badge></td>
                    <td className="px-4 py-4">{item.difficulty}</td>
                    <td className="px-4 py-4 text-heritage-green">
                      {Array.isArray(item.answers)
                        ? item.answers[item.correct_index]
                        : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          className="rounded-xl bg-emerald-50 px-3 py-2 font-bold text-heritage-green"
                          onClick={() => openQuestion(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-xl bg-rose-50 p-2 text-rose-600"
                          onClick={() => deleteQuestion(item)}
                          aria-label="Delete question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "word-puzzles" && (
        <section className="mt-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <button
                type="button"
                onClick={() => setTab("games")}
                className="focus-ring mb-2 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 hover:text-heritage-green"
              >
                ← Back to game modes
              </button>
              <h2 className="text-2xl font-extrabold">Heritage Word Quest manager</h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage the age-based clues and answers used in the mixed-letter word game.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const wordGame = games.find(
                    (item) => item.slug === "heritage-word-quest",
                  );
                  if (wordGame) openGame(wordGame);
                }}
              >
                <Settings className="h-4 w-4" /> Edit card & video
              </Button>
              <Button onClick={() => openWordPuzzle()}>
                <Plus className="h-4 w-4" /> Add word puzzle
              </Button>
            </div>
          </div>

          <div className="mt-5 max-w-xs">
            <Select
              value={wordPuzzleAge}
              onChange={setWordPuzzleAge}
              options={["All", "entry", "junior", "scholar", "open"]}
              ariaLabel="Filter word puzzles by age group"
            />
          </div>

          <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-200 bg-white">
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Clue</th>
                  <th className="px-4 py-3">Answer</th>
                  <th className="px-4 py-3">Age group</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {wordPuzzles
                  .filter(
                    (item) =>
                      wordPuzzleAge === "All" ||
                      item.age_group === wordPuzzleAge,
                  )
                  .map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="max-w-xl px-4 py-4 font-semibold text-slate-800">
                        {item.clue}
                      </td>
                      <td className="px-4 py-4 font-extrabold text-sky-700">
                        {item.answer}
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone="gray">{item.age_group}</Badge>
                      </td>
                      <td className="px-4 py-4">{item.difficulty}</td>
                      <td className="px-4 py-4">{item.sort_order}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openWordPuzzle(item)}
                            className="rounded-xl bg-sky-50 px-3 py-2 font-bold text-sky-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteWordPuzzle(item)}
                            className="rounded-xl bg-rose-50 p-2 text-rose-600"
                            aria-label="Delete word puzzle"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "games" && (
        <section className="mt-6">
          <div>
            <h2 className="text-2xl font-extrabold">Game manager</h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose which game mode you want to manage.
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-[2rem] border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-heritage-cream p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge tone="green">GAME MODE 1</Badge>
                  <h3 className="mt-3 font-display text-3xl font-extrabold text-slate-950">
                    Quiz Challenges
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                    Manage the normal chapter quiz cards, images, descriptions,
                    videos and other game metadata.
                  </p>
                </div>
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-heritage-green text-white">
                  <Gamepad2 className="h-7 w-7" />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Badge tone="gray">
                  {games.filter((item) => item.slug !== "heritage-word-quest").length} quiz games
                </Badge>
                <Button onClick={createGame} size="sm">
                  <Plus className="h-4 w-4" /> Create new quiz game
                </Button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTab("word-puzzles")}
              className="group overflow-hidden rounded-[2rem] border-2 border-sky-200 bg-gradient-to-br from-sky-50 via-white to-blue-100 p-6 text-left transition hover:-translate-y-1 hover:shadow-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge tone="blue">GAME MODE 2</Badge>
                  <h3 className="mt-3 font-display text-3xl font-extrabold text-slate-950">
                    Heritage Word Quest
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                    Manage mixed-letter puzzles, age groups, answers, hints,
                    explanations and the Word Quest introduction video.
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 font-extrabold text-sky-700">
                    Open Word Quest manager →
                  </div>
                </div>
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded-2xl border border-sky-200 bg-white">
                  <img
                    src="/assets/games/word-quest.svg"
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </button>
          </div>

          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h3 className="text-xl font-extrabold">Homepage game section</h3>
                <p className="mt-1 text-sm text-slate-500">
                  These two cards appear directly on the Home page. Change their
                  images and descriptions here without editing code.
                </p>
              </div>
              <Button onClick={saveSettings} loading={saving}>
                <Save className="h-4 w-4" /> Save homepage game cards
              </Button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50/40">
                <div className="relative h-48 overflow-hidden bg-emerald-50">
                  <img
                    src={
                      settingsForm.homeQuizModeImage ||
                      "/assets/games/ancient-india.webp"
                    }
                    alt="Quiz Challenges homepage card"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="text-xs font-extrabold uppercase tracking-wide">
                      Homepage · Game mode 1
                    </div>
                    <div className="mt-1 font-display text-2xl font-extrabold">
                      {settingsForm.homeQuizModeTitle || "Quiz Challenges"}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-5">
                  <label>
                    <span className={labelClass}>Card title</span>
                    <input
                      className={inputClass}
                      value={settingsForm.homeQuizModeTitle || ""}
                      onChange={(e) =>
                        setSettingsForm((current) => ({
                          ...current,
                          homeQuizModeTitle: e.target.value,
                        }))
                      }
                      placeholder="Quiz Challenges"
                    />
                  </label>

                  <label>
                    <span className={labelClass}>Description</span>
                    <textarea
                      className={`${inputClass} min-h-24`}
                      value={settingsForm.homeQuizModeDescription || ""}
                      onChange={(e) =>
                        setSettingsForm((current) => ({
                          ...current,
                          homeQuizModeDescription: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span className={labelClass}>Image URL</span>
                    <input
                      className={inputClass}
                      value={settingsForm.homeQuizModeImage || ""}
                      onChange={(e) =>
                        setSettingsForm((current) => ({
                          ...current,
                          homeQuizModeImage: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-white px-4 py-3 text-sm font-extrabold text-heritage-green hover:bg-emerald-50">
                    <ImagePlus className="h-4 w-4" /> Upload Quiz Challenge image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadAsset(file, "site");
                          setSettingsForm((current) => ({
                            ...current,
                            homeQuizModeImage: url,
                          }));
                          toast(
                            "Quiz card image uploaded. Press Save homepage game cards.",
                          );
                        } catch (error) {
                          toast(error.message || "Image upload failed.", "error");
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-sky-200 bg-sky-50/40">
                <div className="relative h-48 overflow-hidden bg-sky-50">
                  <img
                    src={
                      settingsForm.homeWordModeImage ||
                      "/assets/games/word-quest.svg"
                    }
                    alt="Heritage Word Quest homepage card"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-sky-950/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="text-xs font-extrabold uppercase tracking-wide">
                      Homepage · Game mode 2
                    </div>
                    <div className="mt-1 font-display text-2xl font-extrabold">
                      {settingsForm.homeWordModeTitle || "Heritage Word Quest"}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-5">
                  <label>
                    <span className={labelClass}>Card title</span>
                    <input
                      className={inputClass}
                      value={settingsForm.homeWordModeTitle || ""}
                      onChange={(e) =>
                        setSettingsForm((current) => ({
                          ...current,
                          homeWordModeTitle: e.target.value,
                        }))
                      }
                      placeholder="Heritage Word Quest"
                    />
                  </label>

                  <label>
                    <span className={labelClass}>Description</span>
                    <textarea
                      className={`${inputClass} min-h-24`}
                      value={settingsForm.homeWordModeDescription || ""}
                      onChange={(e) =>
                        setSettingsForm((current) => ({
                          ...current,
                          homeWordModeDescription: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span className={labelClass}>Image URL</span>
                    <input
                      className={inputClass}
                      value={settingsForm.homeWordModeImage || ""}
                      onChange={(e) =>
                        setSettingsForm((current) => ({
                          ...current,
                          homeWordModeImage: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 bg-white px-4 py-3 text-sm font-extrabold text-sky-700 hover:bg-sky-50">
                    <ImagePlus className="h-4 w-4" /> Upload Word Quest image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadAsset(file, "site");
                          setSettingsForm((current) => ({
                            ...current,
                            homeWordModeImage: url,
                          }));
                          toast(
                            "Word Quest card image uploaded. Press Save homepage game cards.",
                          );
                        } catch (error) {
                          toast(error.message || "Image upload failed.", "error");
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h3 className="text-xl font-extrabold">Quiz game cards</h3>
              <p className="mt-1 text-sm text-slate-500">
                Click a quiz card below to edit it.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {games
              .filter((game) => game.slug !== "heritage-word-quest")
              .map((game, index, quizGames) => (
                <div
                  key={game.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => openGame(game)}
                    className="group block w-full text-left transition hover:bg-slate-50"
                  >
                    <div className="relative">
                      <img
                        src={game.payload?.image || "/assets/hero-heritage.jpg"}
                        alt=""
                        className="h-40 w-full object-cover"
                      />
                      <div className="absolute left-3 top-3 rounded-full bg-slate-950/75 px-3 py-1.5 text-xs font-extrabold text-white backdrop-blur">
                        Position #{index + 1}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="font-extrabold text-slate-950">{game.title}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {game.category} · {game.difficulty}
                      </div>
                      <div className="mt-3 text-xs font-bold text-heritage-green">
                        Click card to edit content
                      </div>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 bg-slate-50 p-4">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                        Move to position
                      </span>
                      <select
                        value={index + 1}
                        disabled={saving}
                        onChange={(e) =>
                          moveGamePosition(game.id, Number(e.target.value))
                        }
                        className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-extrabold text-slate-700 outline-none disabled:opacity-50"
                      >
                        {quizGames.map((_, positionIndex) => (
                          <option
                            key={positionIndex + 1}
                            value={positionIndex + 1}
                          >
                            Position {positionIndex + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {tab === "chapters" && (
        <section className="mt-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-extrabold">Learning chapter manager</h2>
              <p className="mt-1 text-sm text-slate-500">
                Modify existing chapters or create a new learning chapter.
              </p>
            </div>
            <Button onClick={createChapter}>
              <Plus className="h-4 w-4" /> Create new chapter
            </Button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((chapter) => (
              <button
                key={chapter.slug}
                onClick={() => openChapter(chapter)}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-card"
              >
                {chapter.payload?.image ? (
                  <img
                    src={chapter.payload.image}
                    alt={`${chapter.title} chapter`}
                    className="h-36 w-full object-cover"
                  />
                ) : (
                  <div className="grid h-36 place-items-center bg-slate-100 text-slate-400">
                    <FileImage className="h-8 w-8" />
                  </div>
                )}
                <div className="p-5">
                  <div className="text-xs font-extrabold uppercase tracking-wide text-heritage-saffron">
                  {chapter.era || "Heritage"}
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="text-xl font-extrabold">{chapter.title}</div>
                  {chapter.payload?.testVideo ? (
                    <Badge tone="green">Video ready</Badge>
                  ) : (
                    <Badge tone="gray">No test video</Badge>
                  )}
                </div>
                <div className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                  {chapter.description}
                </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {tab === "students" && (
        <section className="mt-6">
          <h2 className="text-2xl font-extrabold">Student manager</h2>
          <p className="mt-1 text-sm text-slate-500">
            View student profiles and learning performance. Passwords are never exposed to the admin panel.
          </p>
          <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-200 bg-white">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">DOB</th>
                  <th className="px-4 py-3">Age group</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Completed</th>
                  <th className="px-4 py-3">Certificates</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentRows.map((row) => (
                  <tr key={row.user_id} className="border-t border-slate-100">
                    <td className="px-4 py-4">
                      <div className="font-extrabold">{row.full_name}</div>
                      <div className="text-xs text-slate-400">{row.user_id}</div>
                    </td>
                    <td className="px-4 py-4">{row.dob}</td>
                    <td className="px-4 py-4"><Badge>{row.age_group}</Badge></td>
                    <td className="px-4 py-4 font-extrabold text-heritage-green">{row.totalScore}</td>
                    <td className="px-4 py-4">{row.completed}</td>
                    <td className="px-4 py-4">{row.certificateCount}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setStudentForm({ ...row })}
                          className="rounded-xl bg-emerald-50 px-3 py-2 font-bold text-heritage-green"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => resetStudent(row)}
                          className="rounded-xl bg-rose-50 px-3 py-2 font-bold text-rose-600"
                        >
                          Reset learning
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "certificates" && (
        <section className="mt-6">
          <h2 className="text-2xl font-extrabold">Certificate manager</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review and remove generated completion certificates.
          </p>
          <div className="mt-5 grid gap-3">
            {certificates.map((certificate) => {
              const profile = profiles.find((item) => item.user_id === certificate.user_id);
              return (
                <div
                  key={certificate.id}
                  className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-extrabold">
                        {profile?.full_name || "Student"} · {certificate.task_name}
                      </div>
                      <Badge
                        tone={
                          certificate.award_tier === "gold"
                            ? "gold"
                            : certificate.award_tier === "silver"
                              ? "gray"
                              : "orange"
                        }
                      >
                        {String(certificate.award_tier || "bronze").toUpperCase()}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {certificate.correct_answers ?? 0}/{certificate.total_questions ?? 10} correct · {certificate.verification_code} · {new Date(certificate.issued_at).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCertificate(certificate)}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              );
            })}
            {!certificates.length && (
              <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                No certificates generated yet.
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "assets" && (
        <section className="mt-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-extrabold">Images & files</h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload website images and lesson videos to Supabase Storage and use them in games, chapters or site settings.
              </p>
            </div>
            <label className="focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-heritage-green px-5 py-3 text-sm font-bold text-white">
              <ImagePlus className="h-4 w-4" /> Upload asset
              <input
                type="file"
                accept="image/*,video/mp4"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const url = await uploadAsset(file, "admin");
                    toast("Asset uploaded.");
                    if (url) {
                      await navigator.clipboard?.writeText?.(url).catch(() => {});
                    }
                  } catch (error) {
                    toast(error.message || "Upload failed.", "error");
                  }
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {assets.map((asset) => {
              const publicUrl = supabase.storage
                .from("game-images")
                .getPublicUrl(asset.path || asset.name).data.publicUrl;
              return (
                <div key={asset.id || asset.name} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                  <div className="grid h-40 place-items-center bg-slate-50">
                    {/\.(png|jpe?g|webp|gif|svg)$/i.test(asset.name) ? (
                      <img src={publicUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <FileImage className="h-10 w-10 text-slate-300" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="truncate text-sm font-bold">{asset.path || asset.name}</div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => navigator.clipboard?.writeText?.(publicUrl)}
                        className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-heritage-green"
                      >
                        Copy URL
                      </button>
                      <button
                        onClick={() => removeAsset(asset)}
                        className="rounded-xl bg-rose-50 p-2 text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === "settings" && (
        <section className="mt-6">
          <div className="max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-extrabold">Website settings</h2>
            <p className="mt-1 text-sm text-slate-500">
              Change the homepage hero, featured learning area, intro video and challenge targets.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {[
                ["heroEyebrow", "Hero eyebrow"],
                ["heroTitle", "Hero title"],
                ["heroAccent", "Hero accent"],
                ["heroImage", "Hero image URL"],
                ["featuredTitle", "Featured title"],
                ["featuredAccent", "Featured accent"],
                ["featuredImage", "Featured image URL"],
                ["introVideo", "Introduction video URL"],
                ["dailyChallengeQuestions", "Daily challenge questions"],
                ["weeklyGoalPoints", "Weekly goal points"],
              ].map(([key, label]) => (
                <label key={key}>
                  <span className={labelClass}>{label}</span>
                  <input
                    className={inputClass}
                    value={settingsForm[key] ?? ""}
                    onChange={(e) =>
                      setSettingsForm((current) => ({
                        ...current,
                        [key]: e.target.value,
                      }))
                    }
                  />
                </label>
              ))}
              <label className="sm:col-span-2">
                <span className={labelClass}>Hero description</span>
                <textarea
                  className={`${inputClass} min-h-24`}
                  value={settingsForm.heroDescription || ""}
                  onChange={(e) =>
                    setSettingsForm((current) => ({
                      ...current,
                      heroDescription: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass}>Featured description</span>
                <textarea
                  className={`${inputClass} min-h-24`}
                  value={settingsForm.featuredDescription || ""}
                  onChange={(e) =>
                    setSettingsForm((current) => ({
                      ...current,
                      featuredDescription: e.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["heroImage", "Upload hero image", "image/*", "site"],
                ["featuredImage", "Upload featured image", "image/*", "site"],
                ["introVideo", "Upload intro video", "video/mp4", "site"],
              ].map(([key, label, accept, folder]) => (
                <label
                  key={key}
                  className="focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-white"
                >
                  <ImagePlus className="h-4 w-4" /> {label}
                  <input
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadAsset(file, folder);
                        setSettingsForm((current) => ({
                          ...current,
                          [key]: url,
                        }));
                        toast("Upload complete. Save settings to publish it.");
                      } catch (error) {
                        toast(error.message || "Upload failed.", "error");
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
              ))}
            </div>

            <Button className="mt-6" onClick={saveSettings} loading={saving}>
              <Save className="h-4 w-4" /> Save website settings
            </Button>
          </div>
        </section>
      )}

      {tab === "audit" && (
        <section className="mt-6">
          <h2 className="text-2xl font-extrabold">Admin activity log</h2>
          <div className="mt-5 grid gap-3">
            {auditRows.map((row) => (
              <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="font-bold">
                  {row.action} · {row.entity_type}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {row.entity_id || "—"} · {new Date(row.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {questionForm && (
        <EditorModal title={questionForm.isExisting ? "Edit question" : "Add question"} onClose={() => setQuestionForm(null)}>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass}>Question ID</span>
                <input className={inputClass} value={questionForm.id} disabled={questionForm.isExisting} onChange={(e) => setQuestionForm({ ...questionForm, id: e.target.value })} />
              </label>
              <label>
                <span className={labelClass}>Chapter</span>
                <select className={inputClass} value={questionForm.chapter_slug} onChange={(e) => setQuestionForm({ ...questionForm, chapter_slug: e.target.value })}>
                  {chapters.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}
                </select>
              </label>
              <label>
                <span className={labelClass}>Age group</span>
                <select className={inputClass} value={questionForm.age_group} disabled={questionForm.isExisting} onChange={(e) => setQuestionForm({ ...questionForm, age_group: e.target.value })}>
                  {["all","entry","junior","scholar","open"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span className={labelClass}>Difficulty</span>
                <select className={inputClass} value={questionForm.difficulty} onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}>
                  {["Entry","Normal","Medium","Advanced"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>
            <label>
              <span className={labelClass}>Question</span>
              <textarea className={`${inputClass} min-h-24`} value={questionForm.question} onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {questionForm.answers.map((answer, index) => (
                <label key={index}>
                  <span className={labelClass}>Answer {index + 1}</span>
                  <input
                    className={`${inputClass} ${Number(questionForm.correct_index) === index ? "border-emerald-400 bg-emerald-50" : ""}`}
                    value={answer}
                    onChange={(e) => {
                      const next = [...questionForm.answers];
                      next[index] = e.target.value;
                      setQuestionForm({ ...questionForm, answers: next });
                    }}
                  />
                </label>
              ))}
            </div>
            <label>
              <span className={labelClass}>Correct answer</span>
              <select className={inputClass} value={questionForm.correct_index} onChange={(e) => setQuestionForm({ ...questionForm, correct_index: Number(e.target.value) })}>
                {questionForm.answers.map((answer, index) => <option key={index} value={index}>Answer {index + 1}: {answer || "—"}</option>)}
              </select>
            </label>
            <label>
              <span className={labelClass}>Hint</span>
              <input className={inputClass} value={questionForm.hint || ""} onChange={(e) => setQuestionForm({ ...questionForm, hint: e.target.value })} />
            </label>
            <label>
              <span className={labelClass}>Explanation</span>
              <textarea className={`${inputClass} min-h-24`} value={questionForm.explanation || ""} onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass}>Sort order</span>
                <input type="number" className={inputClass} value={questionForm.sort_order} onChange={(e) => setQuestionForm({ ...questionForm, sort_order: e.target.value })} />
              </label>
              <label>
                <span className={labelClass}>Source label</span>
                <input className={inputClass} value={questionForm.source_label || ""} onChange={(e) => setQuestionForm({ ...questionForm, source_label: e.target.value })} />
              </label>
            </div>
            <Button onClick={saveQuestion} loading={saving}><Save className="h-4 w-4" /> Save question</Button>
          </div>
        </EditorModal>
      )}

      {wordPuzzleForm && (
        <EditorModal
          title={
            wordPuzzleForm.isExisting
              ? "Edit Heritage Word Quest puzzle"
              : "Add Heritage Word Quest puzzle"
          }
          onClose={() => setWordPuzzleForm(null)}
        >
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass}>Puzzle ID</span>
                <input
                  className={inputClass}
                  value={wordPuzzleForm.id}
                  disabled={wordPuzzleForm.isExisting}
                  onChange={(e) =>
                    setWordPuzzleForm({
                      ...wordPuzzleForm,
                      id: slugify(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                <span className={labelClass}>Age group</span>
                <select
                  className={inputClass}
                  value={wordPuzzleForm.age_group}
                  onChange={(e) => {
                    const age = e.target.value;
                    setWordPuzzleForm({
                      ...wordPuzzleForm,
                      age_group: age,
                      difficulty:
                        age === "entry"
                          ? "Entry"
                          : age === "scholar" || age === "open"
                            ? wordPuzzleForm.difficulty
                            : "Medium",
                    });
                  }}
                >
                  {["entry", "junior", "scholar", "open"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelClass}>Difficulty</span>
                <select
                  className={inputClass}
                  value={wordPuzzleForm.difficulty}
                  onChange={(e) =>
                    setWordPuzzleForm({
                      ...wordPuzzleForm,
                      difficulty: e.target.value,
                    })
                  }
                >
                  {["Entry", "Medium", "Advanced"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelClass}>Order</span>
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={wordPuzzleForm.sort_order}
                  onChange={(e) =>
                    setWordPuzzleForm({
                      ...wordPuzzleForm,
                      sort_order: e.target.value,
                    })
                  }
                />
              </label>
            </div>

            <label>
              <span className={labelClass}>Question / clue</span>
              <textarea
                className={`${inputClass} min-h-24`}
                value={wordPuzzleForm.clue}
                onChange={(e) =>
                  setWordPuzzleForm({
                    ...wordPuzzleForm,
                    clue: e.target.value,
                  })
                }
                placeholder="Example: Which Mughal emperor commissioned the Taj Mahal?"
              />
            </label>

            <label>
              <span className={labelClass}>Correct word / answer</span>
              <input
                className={inputClass}
                value={wordPuzzleForm.answer}
                onChange={(e) =>
                  setWordPuzzleForm({
                    ...wordPuzzleForm,
                    answer: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Example: SHAH JAHAN"
              />
            </label>

            <label>
              <span className={labelClass}>Hint</span>
              <input
                className={inputClass}
                value={wordPuzzleForm.hint || ""}
                onChange={(e) =>
                  setWordPuzzleForm({
                    ...wordPuzzleForm,
                    hint: e.target.value,
                  })
                }
              />
            </label>

            <label>
              <span className={labelClass}>Explanation after answer</span>
              <textarea
                className={`${inputClass} min-h-24`}
                value={wordPuzzleForm.explanation || ""}
                onChange={(e) =>
                  setWordPuzzleForm({
                    ...wordPuzzleForm,
                    explanation: e.target.value,
                  })
                }
              />
            </label>

            <Button onClick={saveWordPuzzle} loading={saving}>
              <Save className="h-4 w-4" />
              {wordPuzzleForm.isExisting ? "Save puzzle" : "Create puzzle"}
            </Button>
          </div>
        </EditorModal>
      )}

      {gameForm && (
        <EditorModal
          title={gameForm.isExisting ? `Edit game · ${gameForm.title}` : "Create new game"}
          onClose={() => setGameForm(null)}
        >
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass}>Title</span>
                <input
                  className={inputClass}
                  value={gameForm.title}
                  onChange={(e) =>
                    setGameForm((current) => ({
                      ...current,
                      title: e.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span className={labelClass}>Game ID</span>
                <input
                  className={inputClass}
                  value={gameForm.id || ""}
                  disabled={gameForm.isExisting}
                  onChange={(e) =>
                    setGameForm({ ...gameForm, id: slugify(e.target.value) })
                  }
                  placeholder="example: temple-trail"
                />
              </label>
              <label>
                <span className={labelClass}>URL slug</span>
                <input
                  className={inputClass}
                  value={gameForm.slug || ""}
                  disabled={gameForm.isExisting}
                  onChange={(e) =>
                    setGameForm({ ...gameForm, slug: slugify(e.target.value) })
                  }
                  placeholder="example: temple-trail"
                />
              </label>
              <label><span className={labelClass}>Category</span><input className={inputClass} value={gameForm.category || ""} onChange={(e) => setGameForm({ ...gameForm, category: e.target.value })} /></label>
              <label><span className={labelClass}>Difficulty</span><select className={inputClass} value={gameForm.difficulty || "Medium"} onChange={(e) => setGameForm({ ...gameForm, difficulty: e.target.value })}>{["Medium","Advanced","Mixed"].map((item) => <option key={item}>{item}</option>)}</select></label>
              {gameForm.slug !== "heritage-word-quest" && (
                <label>
                  <span className={labelClass}>Display position</span>
                  <input
                    type="number"
                    min="1"
                    max={Math.max(
                      1,
                      games.filter((item) => item.slug !== "heritage-word-quest").length +
                        (gameForm.isExisting ? 0 : 1),
                    )}
                    className={inputClass}
                    value={gameForm.display_order || 1}
                    onChange={(e) =>
                      setGameForm({
                        ...gameForm,
                        display_order: Number(e.target.value || 1),
                      })
                    }
                  />
                </label>
              )}
              <label><span className={labelClass}>Chapter slug</span><input className={inputClass} value={gameForm.chapterSlug || ""} onChange={(e) => setGameForm({ ...gameForm, chapterSlug: e.target.value })} /></label>
              <label><span className={labelClass}>Players</span><input className={inputClass} value={gameForm.players || ""} onChange={(e) => setGameForm({ ...gameForm, players: e.target.value })} /></label>
              <label><span className={labelClass}>Time</span><input className={inputClass} value={gameForm.time || ""} onChange={(e) => setGameForm({ ...gameForm, time: e.target.value })} /></label>
            </div>
            <label><span className={labelClass}>Card description</span><textarea className={`${inputClass} min-h-20`} value={gameForm.description || ""} onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })} /></label>
            <label><span className={labelClass}>Full description</span><textarea className={`${inputClass} min-h-28`} value={gameForm.longDescription || ""} onChange={(e) => setGameForm({ ...gameForm, longDescription: e.target.value })} /></label>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-32 w-full overflow-hidden rounded-2xl bg-white sm:w-48">
                  {gameForm.image ? (
                    <img
                      src={gameForm.image}
                      alt={`${gameForm.title || "Game"} current artwork`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-slate-400">
                      <FileImage className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-extrabold text-slate-900">
                    Game picture
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Choose a new image below. It uploads to Supabase automatically,
                    then press <strong>Save game</strong> to publish the replacement.
                  </p>
                  <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-heritage-green px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700">
                    <ImagePlus className="h-4 w-4" />
                    {gameForm.image ? "Replace image" : "Add image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadAsset(file, "games");
                          setGameForm((current) => ({ ...current, image: url }));
                          toast("New game image selected. Press Save game to publish it.");
                        } catch (error) {
                          toast(error.message || "Upload failed.", "error");
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Advanced · image URL
                </summary>
                <input
                  className={`${inputClass} mt-2`}
                  value={gameForm.image || ""}
                  onChange={(e) =>
                    setGameForm({ ...gameForm, image: e.target.value })
                  }
                />
              </details>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
              <div className="text-sm font-extrabold text-slate-900">
                Game introduction / pre-test video
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Heritage Word Quest shows this before the game and includes a “Skip & go to game” option.
              </p>

              {gameForm.testVideo ? (
                <video
                  src={gameForm.testVideo}
                  controls
                  preload="metadata"
                  className="mt-4 aspect-video w-full rounded-2xl bg-black object-contain"
                />
              ) : (
                <div className="mt-4 grid min-h-36 place-items-center rounded-2xl border-2 border-dashed border-sky-200 bg-white text-center text-sm font-bold text-slate-400">
                  No game video added yet
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-sky-700">
                  <ImagePlus className="h-4 w-4" />
                  {gameForm.testVideo ? "Replace video" : "Upload video"}
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadAsset(file, "test-videos");
                        setGameForm((current) => ({
                          ...current,
                          testVideo: url,
                        }));
                        toast("Video uploaded. Press Save game to publish it.");
                      } catch (error) {
                        toast(error.message || "Video upload failed.", "error");
                      }
                      e.target.value = "";
                    }}
                  />
                </label>

                {gameForm.testVideo && (
                  <button
                    type="button"
                    onClick={() =>
                      setGameForm((current) => ({
                        ...current,
                        testVideo: "",
                      }))
                    }
                    className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-extrabold text-rose-600"
                  >
                    Remove video
                  </button>
                )}
              </div>
            </div>

            <label><span className={labelClass}>Learning points · one per line</span><textarea className={`${inputClass} min-h-28`} value={gameForm.learnText} onChange={(e) => setGameForm({ ...gameForm, learnText: e.target.value })} /></label>
            <label><span className={labelClass}>Achievements · one per line</span><textarea className={`${inputClass} min-h-24`} value={gameForm.achievementsText} onChange={(e) => setGameForm({ ...gameForm, achievementsText: e.target.value })} /></label>
            <Button onClick={saveGame} loading={saving}>
              {gameForm.isExisting ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {gameForm.isExisting ? "Save game" : "Create game"}
            </Button>
          </div>
        </EditorModal>
      )}

      {chapterForm && (
        <EditorModal
          title={chapterForm.isExisting ? `Edit chapter · ${chapterForm.title}` : "Create new chapter"}
          onClose={() => setChapterForm(null)}
        >
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass}>Title</span>
                <input
                  className={inputClass}
                  value={chapterForm.title}
                  onChange={(e) =>
                    setChapterForm((current) => ({
                      ...current,
                      title: e.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span className={labelClass}>Slug</span>
                <input
                  className={inputClass}
                  value={chapterForm.slug}
                  disabled={chapterForm.isExisting}
                  onChange={(e) =>
                    setChapterForm({ ...chapterForm, slug: slugify(e.target.value) })
                  }
                  placeholder="example: temple-architecture"
                />
              </label>
              <label><span className={labelClass}>Era</span><input className={inputClass} value={chapterForm.era || ""} onChange={(e) => setChapterForm({ ...chapterForm, era: e.target.value })} /></label>
              <label><span className={labelClass}>Tag / category</span><input className={inputClass} value={chapterForm.tag || ""} onChange={(e) => setChapterForm({ ...chapterForm, tag: e.target.value })} /></label>
            </div>
            <label><span className={labelClass}>Description</span><textarea className={`${inputClass} min-h-24`} value={chapterForm.description || ""} onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })} /></label>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-32 w-full overflow-hidden rounded-2xl bg-white sm:w-48">
                  {chapterForm.image ? (
                    <img
                      src={chapterForm.image}
                      alt={`${chapterForm.title || "Chapter"} current artwork`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-slate-400">
                      <FileImage className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-extrabold text-slate-900">
                    Chapter picture
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Choose a new image below. It uploads to Supabase automatically,
                    then press <strong>Save chapter</strong> to publish the replacement.
                  </p>
                  <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-heritage-green px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700">
                    <ImagePlus className="h-4 w-4" />
                    {chapterForm.image ? "Replace image" : "Add image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadAsset(file, "chapters");
                          setChapterForm((current) => ({ ...current, image: url }));
                          toast("New chapter image selected. Press Save chapter to publish it.");
                        } catch (error) {
                          toast(error.message || "Upload failed.", "error");
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Advanced · image URL
                </summary>
                <input
                  className={`${inputClass} mt-2`}
                  value={chapterForm.image || ""}
                  onChange={(e) =>
                    setChapterForm({ ...chapterForm, image: e.target.value })
                  }
                />
              </details>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">
                    Pre-test learning video
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Students will see this video before the chapter test. They can
                    watch it for better understanding or use “Skip & go to test”.
                  </p>
                </div>

                {chapterForm.testVideo ? (
                  <video
                    src={chapterForm.testVideo}
                    controls
                    preload="metadata"
                    className="aspect-video w-full rounded-2xl bg-black object-contain"
                  />
                ) : (
                  <div className="grid min-h-44 place-items-center rounded-2xl border-2 border-dashed border-amber-200 bg-white p-6 text-center">
                    <div>
                      <FileImage className="mx-auto h-8 w-8 text-amber-300" />
                      <div className="mt-2 font-bold text-slate-700">
                        No pre-test video added yet
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        The student screen will still allow them to continue to the test.
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-heritage-saffron px-4 py-2.5 text-sm font-extrabold text-white hover:bg-orange-600">
                    <ImagePlus className="h-4 w-4" />
                    {chapterForm.testVideo ? "Replace test video" : "Upload test video"}
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/ogg"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadAsset(file, "test-videos");
                          setChapterForm((current) => ({
                            ...current,
                            testVideo: url,
                          }));
                          toast(
                            "Test video uploaded. Press Save chapter to publish it.",
                          );
                        } catch (error) {
                          toast(error.message || "Video upload failed.", "error");
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>

                  {chapterForm.testVideo && (
                    <button
                      type="button"
                      onClick={() =>
                        setChapterForm((current) => ({
                          ...current,
                          testVideo: "",
                        }))
                      }
                      className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-extrabold text-rose-600 hover:bg-rose-50"
                    >
                      Remove video
                    </button>
                  )}
                </div>

                <details>
                  <summary className="cursor-pointer text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Advanced · video URL
                  </summary>
                  <input
                    className={`${inputClass} mt-2`}
                    value={chapterForm.testVideo || ""}
                    onChange={(e) =>
                      setChapterForm({
                        ...chapterForm,
                        testVideo: e.target.value,
                      })
                    }
                    placeholder="https://.../lesson.mp4"
                  />
                </details>
              </div>
            </div>

            <label><span className={labelClass}>Learning points · one per line</span><textarea className={`${inputClass} min-h-32`} value={chapterForm.learnText} onChange={(e) => setChapterForm({ ...chapterForm, learnText: e.target.value })} /></label>
            <label><span className={labelClass}>Sections JSON</span><textarea className={`${inputClass} min-h-48 font-mono text-xs`} value={chapterForm.sectionsJson} onChange={(e) => setChapterForm({ ...chapterForm, sectionsJson: e.target.value })} /></label>
            <Button onClick={saveChapter} loading={saving}>
              {chapterForm.isExisting ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {chapterForm.isExisting ? "Save chapter" : "Create chapter"}
            </Button>
          </div>
        </EditorModal>
      )}

      {studentForm && (
        <EditorModal title={`Edit student · ${studentForm.full_name}`} onClose={() => setStudentForm(null)}>
          <div className="grid gap-4">
            <label><span className={labelClass}>Full name</span><input className={inputClass} value={studentForm.full_name || ""} onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className={labelClass}>Date of birth</span><input type="date" className={inputClass} value={studentForm.dob || ""} onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })} /></label>
              <label><span className={labelClass}>Age group</span><select className={inputClass} value={studentForm.age_group} onChange={(e) => setStudentForm({ ...studentForm, age_group: e.target.value })}>{["entry","junior","scholar","open"].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span className={labelClass}>Preferred language code</span><input className={inputClass} value={studentForm.preferred_language || "en"} onChange={(e) => setStudentForm({ ...studentForm, preferred_language: e.target.value })} /></label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><input type="checkbox" checked={Boolean(studentForm.leaderboard_opt_in)} onChange={(e) => setStudentForm({ ...studentForm, leaderboard_opt_in: e.target.checked })} /><span className="text-sm font-bold">Leaderboard opt-in</span></label>
            </div>
            <Button onClick={saveStudent} loading={saving}><Save className="h-4 w-4" /> Save student profile</Button>
          </div>
        </EditorModal>
      )}
    </div>
  );
}

function EditorModal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/60 p-4 sm:p-8">
      <div className="mx-auto w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-extrabold">{title}</h2>
          <button
            onClick={onClose}
            className="focus-ring rounded-xl p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close editor"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
