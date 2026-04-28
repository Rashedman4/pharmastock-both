import DailyVideo from "@/components/app/DailyVideo";
import QuestionForm from "@/components/app/QuestionForm";
export const metadata = {
  title: "تحليلات السوق اليومية | Bio Pharma Stock",
  description:
    "شاهد تحليلات يومية للسوق وتوقعات الأسهم. احصل على آراء الخبراء حول اتجاهات السوق وأداء الأسهم وفرص الاستثمار.",
  keywords: [
    "تحليلات سوق الأسهم",
    "تحليل السوق اليومي",
    "اتجاهات الأسهم",
    "رؤى الاستثمار",
    "تحديثات الأسواق المالية",
    "تحليل فني",
    "استراتيجيات التداول",
    "أخبار السوق",
    "الأسهم الأمريكية",
    "توقعات الأسهم",
  ],
};
export default function DailyVideoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-royalBlue mb-6">
        رؤى السوق اليومية
      </h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <DailyVideo lang="ar" />
        </div>
        <div>
          <QuestionForm lang="ar" />
        </div>
      </div>
    </div>
  );
}
