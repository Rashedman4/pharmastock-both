import AnnouncementsFeed from "@/components/app/AnnouncementsFeed";
import { buildAlternates } from "@/lib/seo";
import {
  getAnnouncementsPage,
  type AnnouncementsPage,
} from "@/lib/queries/announcements";

export const metadata = {
  title: "إعلانات الشركات | Bio Pharma Stock",
  description:
    "إعلانات شركات الأدوية والتكنولوجيا الحيوية الأمريكية التي نغطيها — نتائج التجارب والمحطات التنظيمية وأخبار الشركات.",
  alternates: buildAlternates("/announcements", "ar"),
};

export const revalidate = 300;

export default async function AnnouncementsPageAr() {
  let initialPage: AnnouncementsPage | null = null;
  try {
    initialPage = await getAnnouncementsPage({ page: 1 });
  } catch (error) {
    console.error("/ar/announcements: server-side fetch failed", error);
  }

  return (
    <main dir="rtl" className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-royalBlue dark:text-slate-100">
        إعلانات الشركات
      </h1>
      <AnnouncementsFeed lang="ar" initialPage={initialPage} />
    </main>
  );
}
