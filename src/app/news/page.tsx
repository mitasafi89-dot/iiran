import { NewsFeed } from "@/components/news-feed";
import { Pagination } from "@/components/pagination";
import { getNewsFeed } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Latest News | IIRan",
  description: "Stay informed with the latest news and updates on the humanitarian situation in Iran.",
};

const PER_PAGE = 20;

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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
      <NewsFeed articles={articles} showViewAll={false} />
      <div className="mx-auto max-w-7xl px-4 pb-12">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath="/news"
        />
      </div>
    </div>
  );
}
