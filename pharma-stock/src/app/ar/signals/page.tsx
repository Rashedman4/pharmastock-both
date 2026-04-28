//import { Signal } from "lucide-react";
import SignalsTable from "@/components/app/SignalsTable";

export const metadata = {
  title: "الأفكار | Bio Pharma Stock",
  description: "عرض إشارات التداول الحالية لأسهم الأدوية.",
  keywords: [
    "إشارات الأسهم الدوائية",
    "إشارات التداول",
    "أسهم شركات الأدوية",
    "سوق الأسهم",
    "الاستثمار",
    "تحليل إشارات الأسهم",
    "تداول الأسهم الدوائية",
    "إشارات البيع والشراء",
    "التحليل الفني",
    "اتجاهات السوق",
    "توقعات أسعار الأسهم",
    "تداول قطاع الأدوية",
    "إشارات الأسهم بالذكاء الاصطناعي",
    "مؤشرات الأسواق المالية",
    "أفضل أسهم الأدوية",
  ],
};

export default function SignalsPage() {
  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-royalBlue flex items-center">
          الأفكار
        </h1>
        <div className="mt-2 h-1 w-20 bg-brightTeal"></div>
        <p className="mt-3 text-sm text-gray-600 text-right">
          هذه الإشارات مستندة إلى تحليلات متقدمة وعالية الكفاءة، وهي مقدمة{" "}
          <strong>لأغراض تعليمية فقط</strong>. يجب عليك إجراء بحثك الخاص قبل
          اتخاذ أي قرارات استثمارية. لا نضمن أي نتائج محددة ولسنا مسؤولين عن أي
          خسائر مالية.
        </p>
      </div>
      <SignalsTable lang="ar" />
    </div>
  );
}
