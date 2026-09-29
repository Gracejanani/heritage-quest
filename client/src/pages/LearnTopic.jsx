import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Gamepad2,
  Lightbulb,
  HelpCircle,
  LoaderCircle,
} from "lucide-react";
import { useLiveGames, useLiveTopics } from "../lib/liveContent";
import { Badge, Button } from "../components/ui";
import { useLanguage } from "../context/LanguageContext";
import { usePlayer } from "../context/PlayerContext";
import { AGE_GROUPS } from "../lib/age";

export default function LearnTopic() {
  const games = useLiveGames();
  const learningTopics = useLiveTopics();
  const { slug } = useParams();
  const { language, t, translateTexts } = useLanguage();
  const { player } = usePlayer();
  const ageInfo = AGE_GROUPS[player?.ageGroup] || AGE_GROUPS.scholar;
  const englishLearningApproachCopy = `Heritage Quest automatically uses your registered date of birth to choose the appropriate question level. ${ageInfo.description} Answer choices are deliberately mixed so the correct option is not always in the same position.`;
  const englishChallengeCopy = `Your challenge is prepared for ${ageInfo.label} learners (${ageInfo.range}). Entry, medium and advanced questions use different rewards based on their difficulty.`;
  const baseTopic =
    learningTopics.find((item) => item.slug === slug) || learningTopics[0];
  const baseRelated =
    games.find((game) => game.chapterSlug === baseTopic.slug) || games[0];
  const [translationState, setTranslationState] = useState({
    language: "",
    topic: null,
    related: null,
    ageLabel: ageInfo.label,
    ageRange: ageInfo.range,
    learningApproachCopy: englishLearningApproachCopy,
    challengeCopy: englishChallengeCopy,
  });

  useEffect(() => {
    let active = true;
    const learningApproachCopy = englishLearningApproachCopy;
    const challengeCopy = englishChallengeCopy;

    if (language === "en") {
      setTranslationState({
        language,
        topic: baseTopic,
        related: baseRelated,
        ageLabel: ageInfo.label,
        ageRange: ageInfo.range,
        learningApproachCopy,
        challengeCopy,
      });
      return () => {
        active = false;
      };
    }

    setTranslationState((current) => ({ ...current, language: "" }));

    const texts = [];
    const addText = (value) => {
      texts.push(String(value || ""));
      return texts.length - 1;
    };
    const topicPlan = {
      title: addText(baseTopic.title),
      description: addText(baseTopic.description),
      era: addText(baseTopic.era),
      tag: addText(baseTopic.tag),
      sourceLabel: addText(baseTopic.sourceLabel),
      learn: (baseTopic.learn || []).map(addText),
      sections: (baseTopic.sections || []).map((section) => ({
        section,
        title: addText(section.title),
        body: addText(section.body),
      })),
      sources: (baseTopic.sources || []).map((source) => ({
        source,
        title: addText(source.title),
      })),
    };
    const relatedTitleIndex = addText(baseRelated?.title);
    const relatedDescriptionIndex = addText(baseRelated?.description);
    const ageLabelIndex = addText(ageInfo.label);
    const ageRangeIndex = addText(ageInfo.range);
    const learningApproachIndex = addText(learningApproachCopy);
    const challengeCopyIndex = addText(challengeCopy);

    translateTexts(texts, language)
      .then((translated) => {
        if (!active) return;
        setTranslationState({
          language,
          topic: {
            ...baseTopic,
            title: translated[topicPlan.title],
            description: translated[topicPlan.description],
            era: translated[topicPlan.era],
            tag: translated[topicPlan.tag],
            sourceLabel: translated[topicPlan.sourceLabel],
            learn: topicPlan.learn.map((index) => translated[index]),
            sections: topicPlan.sections.map((plan) => ({
              ...plan.section,
              title: translated[plan.title],
              body: translated[plan.body],
            })),
            sources: topicPlan.sources.map((plan) => ({
              ...plan.source,
              title: translated[plan.title],
            })),
          },
          related: baseRelated
            ? {
                ...baseRelated,
                title: translated[relatedTitleIndex],
                description: translated[relatedDescriptionIndex],
              }
            : null,
          ageLabel: translated[ageLabelIndex],
          ageRange: translated[ageRangeIndex],
          learningApproachCopy: translated[learningApproachIndex],
          challengeCopy: translated[challengeCopyIndex],
        });
      })
      .catch(() => {
        if (!active) return;
        setTranslationState({
          language,
          topic: baseTopic,
          related: baseRelated,
          ageLabel: ageInfo.label,
          ageRange: ageInfo.range,
          learningApproachCopy,
          challengeCopy,
        });
      });

    return () => {
      active = false;
    };
  }, [
    ageInfo.description,
    ageInfo.label,
    ageInfo.range,
    baseRelated,
    baseTopic,
    englishChallengeCopy,
    englishLearningApproachCopy,
    language,
    translateTexts,
  ]);

  const isTranslatingTopic =
    language !== "en" && translationState.language !== language;
  const topic =
    language === "en"
      ? baseTopic
      : translationState.language === language
        ? translationState.topic
        : null;
  const related =
    language === "en"
      ? baseRelated
      : translationState.language === language
        ? translationState.related
        : baseRelated;
  const localizedAge =
    language === "en" || translationState.language !== language
      ? ageInfo
      : {
          ...ageInfo,
          label: translationState.ageLabel,
          range: translationState.ageRange,
        };
  const sources = (() => {
    if (!topic) return [];
    if (topic.sources?.length) return topic.sources;
    if (!topic.sourceUrl) return [];
    return [
      {
        title: topic.sourceLabel || t("wikipediaReference"),
        url: topic.sourceUrl,
      },
    ];
  })();

  if (isTranslatingTopic || !topic) {
    return (
      <div className="container-app py-10 sm:py-14">
        <Link
          to="/learn"
          className="focus-ring inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 hover:text-heritage-green"
        >
          <ArrowLeft className="h-4 w-4" /> {t("backToLearn")}
        </Link>
        <div className="mt-4 grid min-h-[520px] place-items-center rounded-[2rem] border border-emerald-100 bg-white shadow-card">
          <div className="text-center text-heritage-green">
            <LoaderCircle className="mx-auto h-9 w-9 animate-spin" />
            <p className="mt-4 font-extrabold">{t("translating")}</p>
          </div>
        </div>
      </div>
    );
  }

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
                  {localizedAge.label} · {localizedAge.range}
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
              {(topic.learn || []).map((point) => (
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
              <div className="mt-10">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 text-heritage-saffron">
                    <BookMarked className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-950">
                      {t("chapterLesson")}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {t("lessonIntro")}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-5">
                  {topic.sections.map((section, index) => (
                    <section
                      key={`${section.title}-${index}`}
                      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
                    >
                      <div className="text-xs font-extrabold tracking-[.14em] text-heritage-saffron">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <h3 className="mt-2 text-xl font-extrabold text-slate-950">
                        {section.title}
                      </h3>
                      <div className="mt-3 space-y-3 text-[15px] leading-7 text-slate-600">
                        {String(section.body || "")
                          .split(/\n\s*\n/)
                          .filter(Boolean)
                          .map((paragraph, paragraphIndex) => (
                            <p key={paragraphIndex}>{paragraph}</p>
                          ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            )}

            {!topic.studyOnly && (
              <div className="mt-8 rounded-3xl border border-sky-100 bg-sky-50 p-6">
                <div className="flex items-center gap-2 font-extrabold text-sky-900">
                  <Lightbulb className="h-5 w-5" /> {t("learningApproach")}
                </div>
                <p className="mt-2 text-sm leading-6 text-sky-900/70">
                  {translationState.learningApproachCopy ||
                    englishLearningApproachCopy}
                </p>
              </div>
            )}

            {sources.length > 0 && (
              <div className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
                <div className="text-sm font-extrabold text-emerald-950">
                  {t("referenceSources")}
                </div>
                <p className="mt-2 text-sm leading-6 text-emerald-900/70">
                  {t("referenceNote")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-ring inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-heritage-green shadow-sm hover:text-emerald-800"
                    >
                      {source.title} <ExternalLink className="h-4 w-4 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!topic.studyOnly && (
            <aside className="rounded-3xl bg-heritage-forest p-6 text-white">
              <Gamepad2 className="h-8 w-8 text-heritage-gold" />
              <h2 className="mt-4 text-xl font-extrabold">
                {t("readyChallenge")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {translationState.challengeCopy || englishChallengeCopy}
              </p>
              <div className="mt-5 overflow-hidden rounded-2xl bg-white/10">
                <img
                  src={related.image}
                  alt={related.title}
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
                <HelpCircle className="h-4 w-4" /> {localizedAge.label} · {localizedAge.range}
              </div>
              <Button
                as={Link}
                to={`/play/quiz/${baseTopic.slug}`}
                className="mt-5 w-full"
              >
                {t("startChapter")} <ArrowRight className="h-4 w-4" />
              </Button>
            </aside>
          )}
        </div>
      </article>
    </div>
  );
}
