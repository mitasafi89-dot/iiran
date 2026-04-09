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

async function StoriesSection() {
  const stories = await getStories();
  return <HumanStories stories={stories.slice(0, 7)} />;
}

async function DashboardSection() {
  const data = await getDashboardData();
  return <CrisisDashboard data={data} />;
}

async function NewsSection() {
  const articles = await getNewsFeed();
  return <NewsFeed articles={articles.slice(0, 8)} />;
}

async function VideosSection() {
  const videos = await getVideos();
  return <VideoSection videos={videos} />;
}

export default function Home() {
  return (
    <>
      <Hero />
      <SeoContentSection />
      <Suspense fallback={<SectionSkeleton label="Stories" />}>
        <StoriesSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton label="Crisis Dashboard" />}>
        <DashboardSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton label="News" />}>
        <NewsSection />
      </Suspense>
      <DonationSection />
      <EducationSection />
      <Suspense fallback={<SectionSkeleton label="Videos" />}>
        <VideosSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton label="Map" />}>
        <GlobalSupportMap />
      </Suspense>
      <ImpactSection />
    </>
  );
}
