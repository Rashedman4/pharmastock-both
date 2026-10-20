"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface Props {
  /** Markdown source. Raw HTML in it is dropped, never rendered. */
  children: string;
  /** `ar` renders right-to-left. */
  lang?: "en" | "ar";
  className?: string;
}

/**
 * Renders announcement Markdown.
 *
 * `skipHtml` is deliberate: announcement bodies are pasted in from company
 * press releases, so no raw HTML from them ever reaches the DOM. Links always
 * open in a new tab with `rel="noopener noreferrer"`.
 */
export function MarkdownContent({ children, lang = "en", className }: Props) {
  const isArabic = lang === "ar";

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={cn(
        "prose prose-slate max-w-none prose-headings:text-royalBlue prose-a:text-brightTeal",
        "dark:prose-invert dark:prose-headings:text-slate-100",
        isArabic && "text-right",
        className
      )}
    >
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: linkChildren, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {linkChildren}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
