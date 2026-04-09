import { Badge } from "@/components/ui/badge";
import { StoryImage } from "@/components/story-image";

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  description: string;
  imageUrl?: string;
}

export function NewsFeed({ articles, showViewAll = true }: { articles: NewsItem[]; showViewAll?: boolean }) {
  return (
    <section id="news" className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up">
          <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">
            Stay Informed
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Latest News
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The latest updates on the humanitarian situation, sourced from trusted global outlets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, i) => (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow block"
            >
              <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                <StoryImage
                  src={article.imageUrl!}
                  alt={article.title}
                  fill
                  preload={i < 3}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {article.source}
                  </Badge>
                  <time className="text-xs text-muted-foreground">
                    {new Date(article.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </div>
                <h3 className="font-semibold text-sm leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {article.description}
                </p>
                <span className="inline-block mt-3 text-xs text-primary font-medium">
                  Read full article &rarr;
                </span>
              </div>
            </a>
          ))}
        </div>

        {showViewAll && (
          <div className="text-center mt-10">
            <a
              href="/news"
              className="inline-flex items-center justify-center rounded-md border border-border bg-card hover:bg-accent px-6 py-2.5 text-sm font-medium transition-colors"
            >
              View All News
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
