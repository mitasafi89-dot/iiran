import { Suspense } from "react";
import { HumanStories } from "@/components/human-stories";
import { Pagination } from "@/components/pagination";
import { getStories } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Human Stories | IIRan",
  description: "Read the real stories of people whose lives have been changed by humanitarian support in Iran.",
};

const PER_PAGE = 20;

async function StoriesContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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
      <HumanStories stories={stories} showAll />
      <div className="mx-auto max-w-7xl px-4 pb-12">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath="/stories"
        />
      </div>
    </div>
  );
}

export default function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<div className="pt-16 min-h-screen" />}>
      <StoriesContent searchParams={searchParams} />
    </Suspense>
  );
}
