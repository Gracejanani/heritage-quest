import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Award, Download, Printer, ArrowLeft, CheckCircle2 } from "lucide-react";
import { learningTopics } from "../data/content";
import { Button } from "../components/ui";
import { usePlayer } from "../context/PlayerContext";
import { supabase } from "../lib/supabase";
import {
  getCertificateAwardTier,
  issueCertificate,
} from "../lib/certificates";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(value ? new Date(value) : new Date());
}

const AWARD_STYLES = {
  bronze: {
    label: "BRONZE",
    iconClass: "bg-orange-100 text-amber-800",
    sealClass:
      "border-amber-900 bg-gradient-to-br from-orange-200 via-amber-500 to-orange-700 text-amber-950",
    canvasFill: "#b87333",
    canvasStroke: "#7c2d12",
    canvasText: "#4a250b",
  },
  silver: {
    label: "SILVER",
    iconClass: "bg-slate-200 text-slate-600",
    sealClass:
      "border-slate-500 bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 text-slate-800",
    canvasFill: "#c7cbd1",
    canvasStroke: "#64748b",
    canvasText: "#334155",
  },
  gold: {
    label: "GOLD",
    iconClass: "bg-amber-100 text-amber-600",
    sealClass:
      "border-amber-700 bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-600 text-amber-950",
    canvasFill: "#d9a62e",
    canvasStroke: "#8b5e13",
    canvasText: "#5d3a0d",
  },
};

export default function Certificate() {
  const { chapterSlug = "ancient-india" } = useParams();
  const { player, getProgress, progressReady } = usePlayer();
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState("");
  const isWordQuest = chapterSlug === "heritage-word-quest";

  const topic = useMemo(
    () =>
      isWordQuest
        ? {
            slug: "heritage-word-quest",
            title: "Heritage Word Quest",
          }
        : learningTopics.find((item) => item.slug === chapterSlug) ||
          learningTopics[0],
    [chapterSlug, isWordQuest],
  );

  const progress = getProgress(`quiz:${chapterSlug}`, null);
  const completed = Boolean(progress?.finished);

  const progressAnswers = Array.isArray(progress?.answers) ? progress.answers : [];
  const correctCount = progressAnswers.filter((answer) => answer?.correct).length;
  const totalQuestions = Math.max(1, progressAnswers.length || 10);
  const awardTier =
    certificate?.award_tier || getCertificateAwardTier(correctCount);
  const award = AWARD_STYLES[awardTier] || AWARD_STYLES.bronze;

  useEffect(() => {
    let active = true;
    if (!progressReady || !player?.id || !completed || !supabase) return () => {};

    issueCertificate({
      userId: player.id,
      chapterSlug,
      taskName: topic.title,
      correctAnswers: correctCount,
      totalQuestions,
    })
      .then((data) => {
        if (active) setCertificate(data);
      })
      .catch((certificateError) => {
        if (active) setError(certificateError?.message || "Could not save certificate.");
      });

    return () => {
      active = false;
    };
  }, [
    chapterSlug,
    completed,
    correctCount,
    player?.id,
    progressReady,
    topic.title,
    totalQuestions,
  ]);

  const issuedDate = certificate?.issued_at || progress?.updatedAt || new Date();

  const downloadCertificate = () => {
    if (!player) return;

    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 1100;
    const ctx = canvas.getContext("2d");

    if (isWordQuest) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#eff9ff");
      gradient.addColorStop(0.5, "#ffffff");
      gradient.addColorStop(1, "#dbeafe");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalAlpha = 0.08;
      for (let i = 0; i < 90; i += 1) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = 8 + Math.random() * 18;
        ctx.fillStyle = i % 2 ? "#38bdf8" : "#2563eb";
        ctx.fillRect(x, y, size, size);
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = "#f8efd9";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Soft parchment texture.
      ctx.globalAlpha = 0.06;
      for (let i = 0; i < 700; i += 1) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = 1 + Math.random() * 5;
        ctx.fillStyle = i % 2 ? "#8b5a2b" : "#d97706";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    const border = (inset, color, width) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.strokeRect(inset, inset, canvas.width - inset * 2, canvas.height - inset * 2);
    };

    if (isWordQuest) {
      border(30, "#0f4c81", 22);
      border(58, "#38bdf8", 10);
      border(78, "#93c5fd", 4);
      border(96, "#1d4ed8", 3);
    } else {
      border(30, "#155e3d", 22);
      border(58, "#d97706", 10);
      border(78, "#b8872c", 4);
      border(96, "#155e3d", 3);
    }

    ctx.textAlign = "center";
    ctx.fillStyle = isWordQuest ? "#0f3d66" : "#7c3f1d";
    ctx.font = "700 64px Georgia, serif";
    ctx.fillText("HERITAGE QUEST INDIA", 800, 175);

    ctx.fillStyle = isWordQuest ? "#0369a1" : "#166534";
    ctx.font = "700 58px Georgia, serif";
    ctx.fillText("CERTIFICATE OF COMPLETION", 800, 300);

    ctx.fillStyle = "#1f2937";
    ctx.font = "36px Arial, sans-serif";
    ctx.fillText("This certificate is awarded to", 800, 380);

    ctx.fillStyle = isWordQuest ? "#075985" : "#166534";
    ctx.font = "700 78px Georgia, serif";
    ctx.fillText(player.name, 800, 485);

    ctx.strokeStyle = isWordQuest ? "#7dd3fc" : "#b8872c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(390, 515);
    ctx.lineTo(1210, 515);
    ctx.stroke();

    ctx.fillStyle = "#1f2937";
    ctx.font = "34px Arial, sans-serif";
    ctx.fillText("For successfully completing the learning task:", 800, 585);

    ctx.fillStyle = isWordQuest ? "#0f4c81" : "#7c3f1d";
    ctx.font = "700 42px Georgia, serif";
    const task = String(topic.title).toUpperCase();
    ctx.fillText(`“${task}”`, 800, 650);

    ctx.fillStyle = "#475569";
    ctx.font = "29px Arial, sans-serif";
    ctx.fillText(
      isWordQuest
        ? "including the age-based heritage word challenge."
        : "including the quiz and learning challenge.",
      800,
      700,
    );

    // Achievement seal changes by quiz result: bronze, silver or gold.
    ctx.fillStyle = award.canvasFill;
    ctx.beginPath();
    ctx.arc(800, 825, 86, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = award.canvasStroke;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = award.canvasText;
    ctx.font = "700 22px Arial, sans-serif";
    ctx.fillText("HERITAGE QUEST", 800, 805);
    ctx.font = "700 36px Georgia, serif";
    ctx.fillText("★", 800, 842);
    ctx.font = "700 20px Arial, sans-serif";
    ctx.fillText(`${award.label} ACHIEVER`, 800, 872);
    ctx.font = "700 17px Arial, sans-serif";
    ctx.fillText(`${correctCount}/${totalQuestions} CORRECT`, 800, 896);

    ctx.textAlign = "left";
    ctx.fillStyle = "#1f2937";
    ctx.font = "28px Arial, sans-serif";
    ctx.fillText("Completed on:", 210, 900);
    ctx.font = "700 28px Arial, sans-serif";
    ctx.fillText(formatDate(issuedDate), 210, 945);

    ctx.textAlign = "right";
    ctx.font = "italic 34px Georgia, serif";
    ctx.fillText("Heritage Quest Team", 1390, 900);
    ctx.font = "25px Arial, sans-serif";
    ctx.fillText("Heritage Quest Team", 1390, 945);

    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    ctx.font = "18px Arial, sans-serif";
    ctx.fillText(
      `Certificate ID: ${certificate?.verification_code || "HQ-" + chapterSlug.toUpperCase()}`,
      800,
      1015,
    );

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      if (supabase && player?.id) {
        try {
          const storagePath = `${player.id}/${chapterSlug}.png`;
          const { error: uploadError } = await supabase.storage
            .from("certificates")
            .upload(storagePath, blob, {
              contentType: "image/png",
              upsert: true,
            });

          if (uploadError) throw uploadError;

          if (certificate?.id) {
            await supabase
              .from("certificates")
              .update({ storage_path: storagePath })
              .eq("id", certificate.id);
          }
        } catch (uploadError) {
          console.error("Could not save certificate file to Supabase", uploadError);
        }
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Heritage-Quest-${chapterSlug}-certificate.png`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  if (!progressReady) {
    return (
      <div className="container-app grid min-h-[65vh] place-items-center py-12">
        <p className="font-bold text-slate-500">Checking your completion…</p>
      </div>
    );
  }

  if (!completed) {
    return (
      <div className="container-app grid min-h-[65vh] place-items-center py-12">
        <div className="max-w-lg rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-card">
          <Award className="mx-auto h-12 w-12 text-amber-500" />
          <h1 className="mt-4 font-display text-3xl font-extrabold">
            Complete the task first
          </h1>
          <p className="mt-3 text-slate-600">
            Finish the {topic.title} activity to unlock your personalised certificate.
          </p>
          <Button
            as={Link}
            to={isWordQuest ? "/play/word-quest" : `/play/quiz/${chapterSlug}`}
            className="mt-6"
          >
            {isWordQuest ? "Go to Word Quest" : "Go to the quiz"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-10 sm:py-14">
      <Link
        to="/profile"
        className="focus-ring inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to profile
      </Link>

      <div className="mx-auto mt-5 max-w-5xl">
        <div
          className={`relative overflow-hidden rounded-[2rem] border-[10px] p-3 shadow-2xl sm:p-5 ${
            isWordQuest
              ? "border-sky-800 bg-gradient-to-br from-sky-50 via-white to-blue-100"
              : "border-heritage-green bg-[#fbf2dc]"
          }`}
        >
          <div
            className={`rounded-[1.3rem] border-4 p-2 ${
              isWordQuest ? "border-sky-400" : "border-orange-500"
            }`}
          >
            <div
              className={`rounded-xl border-2 px-5 py-10 text-center sm:px-12 sm:py-14 ${
                isWordQuest ? "border-sky-200 bg-white/70" : "border-amber-500"
              }`}
            >
              <div
                className={`font-display text-2xl font-extrabold tracking-[.08em] sm:text-4xl ${
                  isWordQuest ? "text-sky-950" : "text-heritage-brown"
                }`}
              >
                HERITAGE QUEST INDIA
              </div>
              <div
                className={`mx-auto mt-5 grid h-16 w-16 place-items-center rounded-2xl ${award.iconClass}`}
                title={`${award.label} award · ${correctCount}/${totalQuestions} correct`}
              >
                <Award className="h-9 w-9" />
              </div>
              <h1
                className={`mt-6 font-display text-3xl font-extrabold sm:text-5xl ${
                  isWordQuest ? "text-sky-700" : "text-heritage-green"
                }`}
              >
                CERTIFICATE OF COMPLETION
              </h1>
              <p className="mt-6 text-lg text-slate-700">
                This certificate is awarded to
              </p>
              <div
                className={`mx-auto mt-2 max-w-3xl border-b-2 pb-3 font-display text-4xl font-extrabold sm:text-6xl ${
                  isWordQuest
                    ? "border-sky-300 text-sky-800"
                    : "border-amber-500 text-heritage-green"
                }`}
              >
                {player?.name}
              </div>
              <p className="mt-6 text-lg text-slate-700">
                For successfully completing the task:
              </p>
              <h2
                className={`mt-2 font-display text-2xl font-extrabold uppercase sm:text-3xl ${
                  isWordQuest ? "text-sky-950" : "text-heritage-brown"
                }`}
              >
                “{topic.title}”
              </h2>
              <p className="mt-2 text-slate-600">
                {isWordQuest
                  ? "including the age-based heritage word challenge."
                  : "including the quiz and learning challenge."}
              </p>

              <div className="mt-5 inline-flex items-center rounded-full bg-white/70 px-4 py-2 text-sm font-extrabold text-slate-700">
                Score: {correctCount}/{totalQuestions} · {award.label} AWARD
              </div>

              <div
                className={`mx-auto mt-6 grid h-28 w-28 place-items-center rounded-full border-4 font-display font-extrabold shadow-lg ${award.sealClass}`}
              >
                <div>
                  <div className="text-[10px]">HERITAGE QUEST</div>
                  <div className="text-3xl">★</div>
                  <div className="text-xs">{award.label}</div>
                  <div className="text-[10px]">{correctCount}/{totalQuestions} CORRECT</div>
                </div>
              </div>

              <div className="mt-9 grid gap-6 text-left sm:grid-cols-2 sm:items-end">
                <div>
                  <div className="text-sm font-bold text-slate-500">Completed on</div>
                  <div className="mt-1 text-lg font-extrabold">
                    {formatDate(issuedDate)}
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="font-display text-xl font-bold italic">
                    Heritage Quest Team
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Heritage Quest Team
                  </div>
                </div>
              </div>

              {certificate?.verification_code && (
                <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-bold text-slate-500">
                  <CheckCircle2 className="h-4 w-4 text-heritage-green" />
                  Certificate ID: {certificate.verification_code}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-center text-sm font-semibold text-rose-600">
            Certificate was generated locally, but cloud record could not be saved: {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={downloadCertificate}>
            <Download className="h-4 w-4" /> Download Certificate
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
