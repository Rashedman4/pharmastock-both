import { z } from "zod";

/**
 * The announcement payload, shared by the admin API route and the admin page.
 *
 * The page validates the pasted JSON with this same schema before the Preview
 * renders, so the errors an admin sees inline are exactly the ones the server
 * would have returned.
 */

const bilingual = (label: string) =>
  z.object({
    en: z.string().trim().min(1, `${label} (English) is required`),
    ar: z.string().trim().min(1, `${label} (Arabic) is required`),
  });

export const announcementSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Symbol is required")
    .max(20, "Symbol must be 20 characters or fewer"),
  title: bilingual("Title"),
  content: bilingual("Content"),
  source_url: z.string().trim().url("Source URL must be a valid URL").nullish(),
  // Accepts a plain ISO date (2026-10-15) or a full timestamp.
  announced_at: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), "announced_at must be an ISO date")
    .nullish(),
  /** `false` publishes without notifying watchers. */
  notify: z.boolean().optional(),
});

export const announcementUpdateSchema = announcementSchema.extend({
  id: z.number().int().positive(),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;

/** Flattens zod issues into `{ path, message }` for both API errors and the UI. */
export function announcementIssues(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

/** The JSON shape shown as the textarea placeholder / example. */
export const ANNOUNCEMENT_EXAMPLE = `{
  "symbol": "MRNA",
  "title": {
    "en": "Moderna reports positive Phase 3 results",
    "ar": "موديرنا تعلن نتائج إيجابية للمرحلة الثالثة"
  },
  "content": {
    "en": "## Headline\\n\\nThe original English announcement, in **Markdown**.",
    "ar": "## العنوان\\n\\nالترجمة العربية، بتنسيق **ماركداون**."
  },
  "source_url": "https://investors.modernatx.com/news/...",
  "announced_at": "2026-10-15"
}`;
