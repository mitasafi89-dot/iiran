import { Suspense } from "react";
import { HumanStories } from "@/components/human-stories";
import { Pagination } from "@/components/pagination";
import { getStories } from "@/lib/data";
import type { Metadata } from "next";
import { getDictionary } from "../dictionaries";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale);
  return {
    title: `${dict.stories.title} | IIRan`,
    description: dict.stories.description.replace("{count}", ""),
  };
}

const PER_PAGE = 20;

async function StoriesContent({
  searchParams,
  lang,
  dict,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  lang: Locale;
  dict: Awaited<ReturnType<typeof getDictionary>>;
}) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  const allStories = await getStories();
  const totalPages = Math.ceil(allStories.length / PER_PAGE);
  const stories = allStories.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  return (
    <div className="pt-16">
      <HumanStories stories={stories} showAll dict={dict.stories} commonDict={dict.common} lang={lang} />
      <div className="mx-auto max-w-7xl px-4 pb-12">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath={`/${lang}/stories`}
          dict={dict.pagination}
        />
      </div>
    </div>
  );
}

export default async function StoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <Suspense fallback={<div className="pt-16 min-h-screen" />}>
      <StoriesContent searchParams={searchParams} lang={locale} dict={dict} />
    </Suspense>
  );
}
