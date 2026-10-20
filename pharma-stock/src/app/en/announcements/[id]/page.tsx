import { notFound } from "next/navigation";
import AnnouncementArticle from "@/components/app/AnnouncementArticle";
import { buildAlternates } from "@/lib/seo";
import { getAnnouncementById } from "@/lib/queries/announcements";

export const revalidate = 300;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const announcement = await getAnnouncementById(Number(id)).catch(() => null);

  if (!announcement) {
    return { title: "Announcement | Bio Pharma Stock" };
  }

  return {
    title: `${announcement.symbol}: ${announcement.title_en} | Bio Pharma Stock`,
    description: announcement.content_en.replace(/[#*_`>[\]]/g, "").slice(0, 160),
    alternates: buildAlternates(`/announcements/${announcement.id}`, "en"),
  };
}

export default async function AnnouncementPage({ params }: Props) {
  const { id } = await params;
  const announcement = await getAnnouncementById(Number(id));
  if (!announcement) notFound();

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <AnnouncementArticle lang="en" announcement={announcement} />
    </main>
  );
}
