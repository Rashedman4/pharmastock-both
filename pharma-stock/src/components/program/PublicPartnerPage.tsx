"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  HeroPanel,
  LoadingBlock,
  RoleTimeline,
  SectionCard,
  StatCard,
} from "@/components/program/shared";

export default function PublicPartnerPage({
  lang = "en",
}: {
  lang?: "en" | "ar";
}) {
  const base = `/${lang}`;
  const isArabic = lang === "ar";
  const [partnerStatus, setPartnerStatus] = useState<string>("NONE");
  const [loading, setLoading] = useState(true);

  const t = isArabic
    ? {
        loading: "جاري تحميل برنامج الشركاء...",
        badge: "برنامج الشركاء",
        title: "مسار الشريك واضح. بدون تعقيد. بدون منطق مخفي.",
        description:
          "قدّم مرة واحدة، احصل على موافقة الإدارة، استلم رمز إحالة واحد، وتتبع المستثمرين المرتبطين بك مع عرض مباشر للربح المحقق ونسبتك 5% عند إغلاق الصفقات.",
        reviewApplication: "مراجعة الطلب",
        applyAsPartner: "قدّم كشريك",
        openWorkspace: "فتح مساحة الشريك",
        openDashboard: "فتح لوحة التحكم",
        timeline: [
          {
            title: "قدّم باسمك ورقم هاتفك ونبذة قصيرة",
            description:
              "هذا يكفي للمراجعة. الحقول القديمة المبالغ فيها تم حذفها.",
          },
          {
            title: "احصل على الموافقة واستلم رمز إحالة واحد",
            description: "شريك واحد، رمز أساسي واحد. واضح ونظيف.",
          },
          {
            title: "ادعُ المستثمرين إلى برنامج النخبة",
            description: "الرابط يحمل رمزك، ويتم تثبيت الإسناد عند التقديم.",
          },
          {
            title: "تتبّع المستثمرين المرتبطين بك والربح المحقق",
            description:
              "يمكنك رؤية المستثمرين المرتبطين بك والربح الناتج بعد الإغلاقات.",
          },
        ],
        partnerShare: "نسبة الشريك",
        attributionModel: "نموذج الإسناد",
        partnerTools: "أدوات الشريك",
        partnerShareValue: "5%",
        partnerShareHint: "تُسجل عند إغلاق صفقة رابحة.",
        attributionValue: "مستثمر واحد ← شريك واحد",
        attributionHint: "بدون فوضى نقرات الإحالة.",
        toolsValue: "طلب + لوحة تحكم + عملاء",
        toolsHint: "وما عدا ذلك كان ضجيجًا بلا فائدة.",
        canDoTitle: "ما الذي يستطيع الشريك فعله؟",

        canDoItems: [
          "إرسال طلب واضح يتضمن رقم الهاتف ووصفًا شخصيًا.",
          "عرض ونسخ رمز الإحالة ورابط دعوة النخبة.",
          "رؤية كل مستثمر مرتبط بك والربح المحقق الناتج عنه.",
          "فتح مستثمر محدد لمراجعة النشاط وسجل الإغلاقات.",
        ],
      }
    : {
        loading: "Loading partner program...",
        badge: "Partner Program",
        title: "Clear partner workflow. No junk. No hidden logic.",
        description:
          "Apply once, get approved by admin, receive one referral code, and track the investors linked to you with a direct view of realized profit and your 5% share when deals close.",
        reviewApplication: "Review application",
        applyAsPartner: "Apply as a partner",
        openWorkspace: "Open partner workspace",
        openDashboard: "Open dashboard",
        timeline: [
          {
            title: "Apply with your name, phone, and short bio",
            description:
              "That is enough for review. The old overengineered fields are gone.",
          },
          {
            title: "Get approved and receive one referral code",
            description: "One partner, one primary code. Clean and obvious.",
          },
          {
            title: "Invite investors to the Elite Program",
            description:
              "The URL carries your code, and attribution is locked on application.",
          },
          {
            title: "Track linked investors and realized profit",
            description:
              "You can see which investors are tied to you and the profit generated after closures.",
          },
        ],
        partnerShare: "Partner share",
        attributionModel: "Attribution model",
        partnerTools: "Partner tools",
        partnerShareValue: "5%",
        partnerShareHint: "Stored when a profitable position closes.",
        attributionValue: "One investor → one partner",
        attributionHint: "No referral click spaghetti.",
        toolsValue: "Application + dashboard + clients",
        toolsHint: "The rest was unnecessary noise.",
        canDoTitle: "What partners can do",

        canDoItems: [
          "Submit a clear application with phone number and personal description.",
          "View and copy the referral code and Elite invitation link.",
          "See every linked investor and the realized profit generated.",
          "Open a specific investor to inspect activity and closure history.",
        ],
      };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/partners/me", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          setPartnerStatus(String(json?.status || "NONE").toUpperCase());
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingBlock label={t.loading} />;

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`space-y-8 ${isArabic ? "text-right" : ""}`}
    >
      <HeroPanel
        lang={lang}
        badge={t.badge}
        title={t.title}
        description={t.description}
        actions={
          <>
            {partnerStatus !== "APPROVED" ? (
              <Button asChild size="lg">
                <Link href={`${base}/partners/apply`}>
                  {partnerStatus === "PENDING"
                    ? t.reviewApplication
                    : t.applyAsPartner}
                </Link>
              </Button>
            ) : null}

            {partnerStatus == "APPROVED" ? (
              <Button
                asChild
                variant="default"
                size="lg"
                className="bg-blue-700 text-white hover:bg-blue-800"
              >
                <Link href={`${base}/partners/dashboard`}>
                  {partnerStatus === "APPROVED"
                    ? t.openWorkspace
                    : t.openDashboard}
                </Link>
              </Button>
            ) : null}
          </>
        }
      >
        <div className={`space-y-4 ${isArabic ? "text-right" : "text-left"}`}>
          <RoleTimeline items={t.timeline} lang={lang} embedded />
        </div>
      </HeroPanel>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label={t.partnerShare}
          value={t.partnerShareValue}
          hint={t.partnerShareHint}
        />
        <StatCard
          label={t.attributionModel}
          value={t.attributionValue}
          hint={t.attributionHint}
        />
        <StatCard
          label={t.partnerTools}
          value={t.toolsValue}
          hint={t.toolsHint}
        />
      </div>

      <div>
        <SectionCard title={t.canDoTitle}>
          <ul className="space-y-3 text-sm text-slate-600">
            {t.canDoItems.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
