import React from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Gamepad2,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import { games, learningTopics } from "../data/content";
import { Badge, Button } from "../components/ui";
import { useLanguage } from "../context/LanguageContext";
import { usePlayer } from "../context/PlayerContext";
import { AGE_GROUPS } from "../lib/age";

export default function LearnTopic() {
  const { slug } = useParams();
  const { t, localizeTopic } = useLanguage();
  const { player } = usePlayer();
  const ageInfo = AGE_GROUPS[player?.ageGroup] || AGE_GROUPS.scholar;
  const baseTopic =
    learningTopics.find((item) => item.slug === slug) || learningTopics[0];
  const topic = localizeTopic(baseTopic);
  const related = games.find((g) => g.chapterSlug === baseTopic.slug) || games[0];

  return (
    <div className="container-app py-10 sm:py-14">
      <Link
        to="/learn"
        className="focus-ring inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 hover:text-heritage-green"
      >
        <ArrowLeft className="h-4 w-4" /> {t("backToLearn")}
      </Link>

      <article className="mt-4 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card">
        <div className="relative h-[320px] sm:h-[420px]">
          <img
            src={topic.image}
            alt={`${topic.title} learning illustration`}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-7 text-white sm:p-10">
            <div className="flex flex-wrap gap-2">
              <Badge tone="gold">{topic.era}</Badge>
              {topic.studyOnly ? (
                <Badge tone="orange">{t("studyMaterial")}</Badge>
              ) : (
                <Badge tone="orange">
                  {ageInfo.label} · {ageInfo.range}
                </Badge>
              )}
            </div>
            <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
              {topic.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
              {topic.description}
            </p>
          </div>
        </div>

        <div className={`grid gap-8 p-7 sm:p-10 ${topic.studyOnly ? "" : "lg:grid-cols-[1fr_340px]"}`}>
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-extrabold text-heritage-green">
              <BookOpen className="h-5 w-5" /> {t("whatYouLearn")}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {topic.learn.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-2xl bg-heritage-cream p-4 text-sm font-semibold text-slate-700"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-heritage-green" />
                  {point}
                </div>
              ))}
            </div>

            {topic.sections?.length > 0 && (
              <div className="mt-8 grid gap-5">
                {topic.sections.map((section, index) => (
                  <section
                    key={section.title}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="text-xs font-extrabold tracking-[.14em] text-heritage-saffron">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <h2 className="mt-2 text-xl font-extrabold text-slate-950">
                      {section.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {section.body}
                    </p>
                  </section>
                ))}
              </div>
            )}

            {!topic.studyOnly && (
              <div className="mt-8 rounded-3xl border border-sky-100 bg-sky-50 p-6">
                <div className="flex items-center gap-2 font-extrabold text-sky-900">
                  <Lightbulb className="h-5 w-5" /> {t("learningApproach")}
                </div>
                <p className="mt-2 text-sm leading-6 text-sky-900/70">
                  Heritage Quest automatically uses your registered date of birth
                  to choose the appropriate question level. {ageInfo.description}
                  Answer choices are deliberately mixed so the correct option is
                  not always in the same position.
                </p>
              </div>
            )}

            {topic.studyOnly && topic.sourceUrl && (
              <div className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
                <div className="text-sm font-extrabold text-emerald-950">
                  {t("source")}
                </div>
                <p className="mt-2 text-sm leading-6 text-emerald-900/70">
                  This prototype study note is a concise educational summary.
                  Use the linked reference for the fuller source article and its
                  citations.
                </p>
                <a
                  href={topic.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-heritage-green shadow-sm"
                >
                  {t("wikipediaReference")} <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>

          {!topic.studyOnly && (
            <aside className="rounded-3xl bg-heritage-forest p-6 text-white">
              <Gamepad2 className="h-8 w-8 text-heritage-gold" />
              <h2 className="mt-4 text-xl font-extrabold">
                Ready for the chapter challenge?
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Your challenge is prepared for {ageInfo.label} learners
                ({ageInfo.range}). Entry, medium and advanced questions use
                different rewards based on their difficulty.
              </p>
              <div className="mt-5 overflow-hidden rounded-2xl bg-white/10">
                <img
                  src={related.image}
                  alt="Related game"
                  className="h-28 w-full object-cover"
                />
                <div className="p-4">
                  <div className="font-extrabold">{related.title}</div>
                  <div className="mt-1 text-xs text-white/60">
                    {related.description}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-100">
                <HelpCircle className="h-4 w-4" /> {ageInfo.label} · {ageInfo.range}
              </div>
              <Button
                as={Link}
                to={`/play/quiz/${baseTopic.slug}`}
                className="mt-5 w-full"
              >
                Start Chapter <ArrowRight className="h-4 w-4" />
              </Button>
            </aside>
          )}
        </div>
      </article>
    </div>
  );
}
