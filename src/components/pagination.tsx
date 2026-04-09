import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1 mt-12">
      {/* Previous */}
      {currentPage > 1 ? (
        <a
          href={`${basePath}?page=${currentPage - 1}`}
          className="inline-flex items-center justify-center w-11 h-11 rounded-md border border-border bg-card hover:bg-accent transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </a>
      ) : (
        <span className="inline-flex items-center justify-center w-11 h-11 rounded-md border border-border bg-card opacity-40 cursor-not-allowed" aria-disabled="true">
          <ChevronLeft className="w-4 h-4" />
        </span>
      )}

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="w-11 h-11 flex items-center justify-center text-sm text-muted-foreground">
            ...
          </span>
        ) : (
          <a
            key={p}
            href={`${basePath}?page=${p}`}
            className={`inline-flex items-center justify-center w-11 h-11 rounded-md border text-sm font-medium transition-colors ${
              p === currentPage
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-accent"
            }`}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {p}
          </a>
        )
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <a
          href={`${basePath}?page=${currentPage + 1}`}
          className="inline-flex items-center justify-center w-11 h-11 rounded-md border border-border bg-card hover:bg-accent transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </a>
      ) : (
        <span className="inline-flex items-center justify-center w-11 h-11 rounded-md border border-border bg-card opacity-40 cursor-not-allowed" aria-disabled="true">
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </nav>
  );
}

// Generates page numbers with ellipsis: [1, 2, 3, "...", 10]
function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}
