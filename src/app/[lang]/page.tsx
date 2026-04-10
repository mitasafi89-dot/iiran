import { Suspense } from "react";
import { Hero } from "@/components/hero";
import { HumanStories } from "@/components/human-stories";
import { CrisisDashboard } from "@/components/crisis-dashboard";
import { NewsFeed } from "@/components/news-feed";
import { DonationSection } from "@/components/donation-section";
import { EducationSection } from "@/components/education-section";
import { SeoContentSection } from "@/components/seo-content-section";
import { GlobalSupportMap } from "@/components/global-support-map";
import { ImpactSection } from "@/components/impact-section";
import { VideoSection } from "@/components/video-section";
import {
  getStories,
  getDashboardData,
  getNewsFeed,
  getVideos,
} from "@/lib/data";
import { getDictionary, type Dictionary } from "./dictionaries";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="h-6 w-32 bg-muted rounded mx-auto mb-4 animate-pulse" />
        <div className="h-10 w-64 bg-muted rounded mx-auto mb-4 animate-pulse" />
        <div className="h-4 w-96 bg-muted rounded mx-auto animate-pulse" />
        <span className="sr-only">Loading {label}...</span>
      </div>
    </div>
  );
}

async function StoriesSection({ lang, dict, commonDict }: { lang: Locale; dict: Dictionary["stories"]; commonDict: Dictionary["common"] }) {
  const stories = await getStories();
  return <HumanStories stories={stories.slice(0, 7)} dict={dict} commonDict={commonDict} lang={lang} />;
}

async function DashboardSection({ dict }: { dict: Dictionary["crisis"] }) {
  const data = await getDashboardData();
  return <CrisisDashboard data={data} dict={dict} />;
}

async function NewsSection({ lang, dict }: { lang: Locale; dict: Dictionary["news"] }) {
  const articles = await getNewsFeed();
  return <NewsFeed articles={articles.slice(0, 8)} dict={dict} lang={lang} />;
}

async function VideosSection({ dict }: { dict: Dictionary["video"] }) {
  const videos = await getVideos();
  return <VideoSection videos={videos} dict={dict} />;
}

async function MapSection({ dict }: { dict: Dictionary["map"] }) {
  return <GlobalSupportMap dict={dict} />;
}

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <>
      <Hero dict={dict} lang={locale} />
      <SeoContentSection dict={dict} lang={locale} />
      <Suspense fallback={<SectionSkeleton label={dict.common.loading || "Stories"} />}>
        <StoriesSection lang={locale} dict={dict.stories} commonDict={dict.common} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton label={dict.common.loading || "Crisis Dashboard"} />}>
        <DashboardSection dict={dict.crisis} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton label={dict.common.loading || "News"} />}>
        <NewsSection lang={locale} dict={dict.news} />
      </Suspense>
      <DonationSection dict={dict} lang={locale} />
      <EducationSection dict={dict.education} />
      <Suspense fallback={<SectionSkeleton label={dict.common.loading || "Videos"} />}>
        <VideosSection dict={dict.video} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton label={dict.common.loading || "Map"} />}>
        <MapSection dict={dict.map} />
      </Suspense>
      <ImpactSection dict={dict.impact} />
    </>
  );
}
