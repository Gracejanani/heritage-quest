import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Gamepad2,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { games, learningTopics } from "../data/content";
import { Badge, Button, SearchBar } from "../components/ui";
import { useLanguage } from "../context/LanguageContext";

export default function Learn() {
  const [query, setQuery] = useState("");
  const { language, t, localizeTopic } = useLanguage();

  const localizedTopics = useMemo(
    () => learningTopics.map((topic) => localizeTopic(topic)),
    [language],
  );

  const filtered = useMemo(
    () =>
      localizedTopics.filter((tpc) =>
        `${tpc.title} ${tpc.description} ${tpc.tag} ${tpc.learn.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [localizedTopics, query],
  );

  return (
    <div>
      <section className="bg-heritage-cream py-14 sm:py-20">
        <div className="container-app grid items-center gap-8 lg:grid-cols-[1fr_.75fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-extrabold text-heritage-green">
              <BookOpen className="h-4 w-4" /> {t("learningHub")}
            </div>
            <h1 className="mt-4 font-display text-5xl font-extrabold text-heritage-brown sm:text-6xl">
              {t("exploreLearnGrow")}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              {t("learningIntro")}
            </p>
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder={t("searchLearning")}
              className="mt-7 max-w-2xl"
            />
          </div>
          <div className="relative hidden lg:block">
            <img
              src="/assets/explorer-mobile.jpg"
              alt="Young explorer learning about heritage"
              className="mx-auto h-[360px] w-[280px] rounded-[2rem] object-cover shadow-card"
            />
            <div className="absolute -bottom-4 -left-2 rounded-2xl bg-white p-4 shadow-card">
              <Sparkles className="h-5 w-5 text-heritage-saffron" />
              <div className="mt-2 text-sm font-extrabold">
                12 quiz chapters + 2 study materials
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-app py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((topic, i) => {
            const related =
              games.find((g) => g.chapterSlug === topic.slug) ||
              games[i % games.length];

            return (
              <article
                key={topic.slug}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-card"
              >
                <img
                  src={topic.image}
                  alt={`${topic.title} illustration`}
                  className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{topic.tag}</Badge>
                    <Badge tone="gray">{topic.era}</Badge>
                  </div>
                  <h2 className="mt-4 text-xl font-extrabold">{topic.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {topic.description}
                  </p>

                  {topic.studyOnly ? (
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800">
                      <BookMarked className="h-3.5 w-3.5" />
                      {t("studyMaterial")}
                    </div>
                  ) : (
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                      <HelpCircle className="h-3.5 w-3.5" />
                      10 · {t("normalAdvanced")}
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between">
                    <Link
                      to={`/learn/${topic.slug}`}
                      className="focus-ring rounded-xl text-sm font-extrabold text-heritage-green"
                    >
                      {t("readChapter")}{" "}
                      <ArrowRight className="ml-1 inline h-4 w-4" />
                    </Link>
                    {!topic.studyOnly && (
                      <Link
                        to={`/play/quiz/${topic.slug}`}
                        className="focus-ring rounded-xl bg-orange-50 p-2 text-heritage-saffron"
                        aria-label={`Play ${related.title}`}
                      >
                        <Gamepad2 className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {!filtered.length && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            No learning topics match your search.
          </div>
        )}
      </section>

      <section className="container-app pb-12">
        <div className="rounded-[2rem] bg-heritage-forest p-8 text-white sm:p-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-100">
                <BookMarked className="h-5 w-5" /> Guided pathway
              </div>
              <h2 className="mt-3 font-display text-3xl font-extrabold">
                From Harappa to the Freedom Movement
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
                Build chronology and context with a mix of seven normal and
                three advanced questions in every chapter.
              </p>
            </div>
            <Button
              as={Link}
              to="/play/quiz/indus-valley-civilization"
              size="lg"
            >
              Start pathway <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
