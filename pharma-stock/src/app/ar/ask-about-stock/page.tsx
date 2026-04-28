import AskAboutStockComp from "@/components/app/AskAboutStockComp";
export const metadata = {
  title: "اسأل عن سهم | Bio Pharma Stock",
  description:
    "احصل على رؤى فورية مدعومة بالذكاء الاصطناعي حول أي سهم. حلل اتجاهات الأسهم الصيدلانية والتجارب السريرية وفرص الاستثمار في قطاع الأدوية.",
  keywords: [
    "اسأل عن سهم",
    "تحليل الأسهم",
    "تحليلات الأسهم بالذكاء الاصطناعي",
    "اتجاهات أسهم الأدوية",
    "متابعة التجارب السريرية",
    "الاستثمار في أسهم الرعاية الصحية",
    "توقعات السوق",
    "تحليل أسهم التكنولوجيا الحيوية",
    "البحوث المالية",
    "استثمارات صناعة الأدوية",
  ],
};
export default function AskAboutStockPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <AskAboutStockComp lang="ar" />
    </div>
  );
}
