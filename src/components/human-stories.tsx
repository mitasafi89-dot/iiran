"use client";

import { useState } from "react";
import { StoryImage } from "@/components/story-image";
import { Badge } from "@/components/ui/badge";

export interface StoryItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  excerpt: string;
  body: string;
  imageUrl?: string;
  theme?: string;
}

export function HumanStories({ stories, showAll = false }: { stories: StoryItem[]; showAll?: boolean }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const featured = stories[0];
  const rest = stories.slice(1);

  return (
    <section id="stories" className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up">
          <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">
            Real People, Real Impact
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Stories of Resilience
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {showAll
              ? `${stories.length} stories from Iranian and international sources, showing the human side of the crisis.`
              : "Touching human stories from Iran and the region, sourced from trusted news outlets and humanitarian organizations."}
          </p>
        </div>

        {stories.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No stories available at this time. Check back soon.
          </p>
        ) : (
          <>
            {/* Featured story - full width, hero-style */}
            {featured && (
              <article className="group mb-10 rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl transition-shadow animate-fade-in-up">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Image side */}
                  <div className="relative aspect-[4/3] lg:aspect-auto bg-muted overflow-hidden">
                    <StoryImage
                      src={featured.imageUrl!}
                      alt={featured.title}
                      fill
                      preload
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>

                  {/* Content side */}
                  <div className="p-8 lg:p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="secondary" className="text-xs">
                        {featured.source}
                      </Badge>
                      {featured.theme && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          {featured.theme}
                        </span>
                      )}
                      <time className="text-xs text-muted-foreground ml-auto">
                        {formatDate(featured.publishedAt)}
                      </time>
                    </div>

                    <h3 className="font-bold text-xl sm:text-2xl leading-snug mb-4">
                      {featured.title}
                    </h3>

                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {expandedId === featured.id
                        ? featured.body
                        : featured.excerpt}
                    </p>

                    <div className="flex items-center gap-4 mt-auto">
                      <a
                        href={featured.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        Read full story &rarr;
                      </a>
                      {featured.body && featured.body.length > featured.excerpt.length && (
                        <button
                          onClick={() =>
                            setExpandedId(expandedId === featured.id ? null : featured.id)
                          }
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          {expandedId === featured.id ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* Remaining stories - card grid with images */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {rest.map((story, i) => (
                <article
                  key={story.id}
                  className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow animate-fade-in-up"
                  style={{ animationDelay: `${(i + 1) * 100}ms` }}
                >
                  {/* Card image */}
                  <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                    <StoryImage
                      src={story.imageUrl!}
                      alt={story.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {story.source}
                      </Badge>
                      <time className="text-xs text-muted-foreground">
                        {formatDate(story.publishedAt)}
                      </time>
                    </div>

                    <h3 className="font-semibold text-base leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {story.title}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                      {expandedId === story.id ? story.body : story.excerpt}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={story.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Read full story &rarr;
                      </a>
                      {story.body && story.body.length > story.excerpt.length && (
                        <button
                          onClick={() =>
                            setExpandedId(expandedId === story.id ? null : story.id)
                          }
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          {expandedId === story.id ? "Less" : "More"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {!showAll && (
          <div className="text-center mt-12">
            <a
              href="/stories"
              className="inline-flex items-center justify-center rounded-md border border-border bg-card hover:bg-accent px-6 py-2.5 text-sm font-medium transition-colors"
            >
              View All Stories
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
