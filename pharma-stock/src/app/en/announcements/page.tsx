import AnnouncementsFeed from "@/components/app/AnnouncementsFeed";
import { buildAlternates } from "@/lib/seo";
import {
  getAnnouncementsPage,
  type AnnouncementsPage,
} from "@/lib/queries/announcements";

export const metadata = {
  title: "Company Announcements | Bio Pharma Stock",
  description:
    "Announcements from the US biopharma companies we cover — trial results, regulatory milestones and corporate news.",
  alternates: buildAlternates("/announcements", "en"),
};

// Same cadence as the news page.
export const revalidate = 300;

export default async function AnnouncementsPageEn() {
  // A failed query must not take the page down: the feed falls back to
  // fetching page 1 itself when handed null.
  let initialPage: AnnouncementsPage | null = null;
  try {
    initialPage = await getAnnouncementsPage({ page: 1 });
  } catch (error) {
    console.error("/en/announcements: server-side fetch failed", error);
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-royalBlue dark:text-slate-100">
        Company Announcements
      </h1>
      <AnnouncementsFeed lang="en" initialPage={initialPage} />
    </main>
  );
}
