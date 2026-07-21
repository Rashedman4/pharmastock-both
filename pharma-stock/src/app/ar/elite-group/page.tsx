import { Suspense } from "react";
import PublicElitePage from "@/components/program/PublicElitePage";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "Elite Investors Group | Bio Pharma Stock",
  description:
    "برنامج Elite Investors Group هو برنامجنا الاستثماري لإدارة المحافظ لكبار المستثمرين، يجمع بين التخطيط المباشر للصفقات ورؤانا البحثية المتخصصة في قطاع الأدوية الحيوية.",
  alternates: buildAlternates("/elite-group", "ar"),
};

function EliteGroupFallback() {
  return <div className="min-h-screen" />;
}

export default function EliteGroupPageAr() {
  return (
    <Suspense fallback={<EliteGroupFallback />}>
      <PublicElitePage lang="ar" />
    </Suspense>
  );
}
