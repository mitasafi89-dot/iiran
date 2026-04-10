import { Suspense } from "react";
import { NewsFeed } from "@/components/news-feed";
import { Pagination } from "@/components/pagination";
import { getNewsFeed } from "@/lib/data";
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
    title: `${dict.news.title} | IIRan`,
    description: dict.news.description,
  };
}

const PER_PAGE = 20;

async function NewsContent({
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

  const allArticles = await getNewsFeed();
  const totalPages = Math.ceil(allArticles.length / PER_PAGE);
  const articles = allArticles.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  return (
    <div className="pt-16">
      <NewsFeed articles={articles} showViewAll={false} dict={dict.news} lang={lang} />
      <div className="mx-auto max-w-7xl px-4 pb-12">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath={`/${lang}/news`}
          dict={dict.pagination}
        />
      </div>
    </div>
  );
}

export default async function NewsPage({
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
      <NewsContent searchParams={searchParams} lang={locale} dict={dict} />
    </Suspense>
  );
}
