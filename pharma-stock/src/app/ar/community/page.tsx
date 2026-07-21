import SocialLinksLanding from "@/components/app/SocialLinksLanding";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "انضم إلى مجتمع المستثمرين | Bio Pharma Stock",
  description:
    "تواصل مع مجتمع Bio Pharma Stock للمستثمرين في قطاع الأدوية والتكنولوجيا الحيوية. تابعنا للحصول على تحديثات الأبحاث والنقاشات وأحدث الأفكار.",
  alternates: buildAlternates("/community", "ar"),
};

export default function JoinPage() {
  return <SocialLinksLanding lang="ar" />;
}
