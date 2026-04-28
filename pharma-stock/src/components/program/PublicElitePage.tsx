"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  PhoneNumberField,
  buildPhoneNumber,
} from "@/components/program/PhoneNumberField";
import {
  HeroPanel,
  LoadingBlock,
  RoleTimeline,
  SectionCard,
  StatusBadge,
} from "@/components/program/shared";
import {
  Shield,
  DollarSign,
  Clock3,
  Users,
  TrendingUp,
  Eye,
} from "lucide-react";
interface EliteStatus {
  status: string;
  memberId?: number | null;
  currentCapitalAmount?: number;
}
const translations = {
  en: {
    loading: "Loading Elite Program...",
    loginTitle: "Login required",
    loginDescription:
      "You need to sign in before submitting an Elite application.",
    loginButton: "Log in first",

    heroBadge: "Elite Program",
    heroTitle: "Professional trade plans with a simple investor workflow.",
    heroDescription:
      "A private investment program for high-capital investors with selected pharma opportunities, precise capital allocation, and professional entry and exit timing.",
    openDashboard: "Open investor dashboard",

    timeline: [
      {
        title: "Apply with your phone number and starting capital",
        description:
          "If you joined through a partner referral link, the connection is captured automatically.",
      },
      {
        title: "Admin reviews and approves your request",
        description:
          "Once approved, your Elite membership and portfolio are created automatically.",
      },
      {
        title: "Receive structured trade plans",
        description:
          "Each plan includes the symbol, targets, quantity, and execution notes.",
      },
      {
        title: "Accept, reject, execute, and close",
        description:
          "You stay in control of your execution while managing your portfolio from one place.",
      },
    ],

    benefitsTitle: "Why Join the Elite Group?",
    benefitsDescription:
      "Focused investment management with clear execution, transparent pricing, and direct access when needed.",
    benefits: [
      {
        title: "Personalized Portfolio Management",
        description:
          "Selected opportunities tailored to your capital and investment goals.",
      },
      {
        title: "Exact Capital Allocation",
        description:
          "Clear instructions on how much capital to place in each trade.",
      },
      {
        title: "Professional Entry & Exit Timing",
        description:
          "Strategic timing for entering and exiting positions with discipline.",
      },
      {
        title: "Direct Communication",
        description:
          "Direct access to our team whenever clarification is needed.",
      },
      {
        title: "Performance-Based Fee",
        description: "We take only 15% of net profit. No profit means no fee.",
      },
      {
        title: "Full Transparency",
        description:
          "Every decision is backed by structured documentation and clear logic.",
      },
    ],

    statusTitle: "Elite membership status",
    statusDescription:
      "Track your application and membership approval from here.",
    referralDetected:
      "Referral code detected in the URL and saved for attribution.",

    statusLabel: "Status:",
    applicationTitle: "Apply for Elite Membership",
    applicationDescription:
      "Submit your phone number, review capital, and any notes needed for approval.",
    phoneLabel: "Phone number",
    phonePlaceholder: "Your direct contact number",
    capitalLabel: "Starting capital for review",
    notesLabel: "Notes",
    notesPlaceholder: "Anything admin should know before reviewing you.",
    submit: "Submit application",
    submitting: "Submitting...",
    success: "Application submitted. Admin review is now required.",
    failedSubmit: "Failed to submit application.",
    phoneCountryPlaceholder: "Select country code",
    phoneRequired: "Phone number is required.",
  },

  ar: {
    loading: "جاري تحميل برنامج النخبة...",
    loginTitle: "تسجيل الدخول مطلوب",
    loginDescription: "يجب تسجيل الدخول قبل إرسال طلب برنامج النخبة.",
    loginButton: "سجّل الدخول أولاً",

    heroBadge: "برنامج النخبة",
    heroTitle: "خطط تداول احترافية بسير عمل واضح وبسيط للمستثمر.",
    heroDescription:
      "برنامج استثماري خاص للمستثمرين ذوي رؤوس الأموال الكبيرة، يوفّر فرصاً دوائية منتقاة، وتوزيعاً دقيقاً لرأس المال، وتوقيتاً احترافياً للدخول والخروج.",
    openDashboard: "افتح لوحة المستثمر",

    timeline: [
      {
        title: "قدّم برقم هاتفك ورأس المال المبدئي",
        description:
          "إذا دخلت عبر رابط إحالة، يتم حفظ الربط تلقائياً في الخلفية.",
      },
      {
        title: "يقوم المشرف بمراجعة الطلب والموافقة عليه",
        description:
          "بعد الموافقة يتم إنشاء عضوية النخبة والمحفظة بشكل تلقائي.",
      },
      {
        title: "استلم خطط تداول واضحة",
        description: "كل خطة تتضمن الرمز والأهداف والكمية وملاحظات التنفيذ.",
      },
      {
        title: "اقبل أو ارفض أو نفّذ أو أغلق",
        description:
          "تبقى أنت المتحكم بالتنفيذ الفعلي مع إدارة محفظتك من مكان واحد.",
      },
    ],

    benefitsTitle: "لماذا تنضم إلى مجموعة إيليت؟",
    benefitsDescription:
      "إدارة استثمارية واضحة، تسعير عادل، وتواصل مباشر عند الحاجة.",
    benefits: [
      {
        title: "إدارة احترافية للمحفظة",
        description:
          "فرص مختارة بعناية بما يناسب رأس مالك وأهدافك الاستثمارية.",
      },
      {
        title: "توزيع دقيق لرأس المال",
        description: "تعليمات واضحة لقيمة الاستثمار في كل صفقة.",
      },
      {
        title: "توقيت احترافي للدخول والخروج",
        description:
          "دخول وخروج منضبطان بتوقيت استراتيجي لتحقيق أفضل نتيجة ممكنة.",
      },
      {
        title: "تواصل مباشر",
        description:
          "قناة مباشرة مع فريقنا عند الحاجة إلى التوضيح أو المتابعة.",
      },
      {
        title: "عمولة على الأداء",
        description: "نأخذ 15٪ من صافي الربح فقط. بدون ربح لا توجد عمولة.",
      },
      {
        title: "شفافية كاملة",
        description: "وضوح كامل في القرارات من خلال توثيق منظم وخطة واضحة.",
      },
    ],

    statusTitle: "حالة عضوية النخبة",
    statusDescription: "تابع من هنا حالة الطلب والموافقة على العضوية.",
    referralDetected: "تم اكتشاف كود الإحالة في الرابط وحفظه للاحتساب.",

    applicationTitle: "قدّم لعضوية مجموعة إيليت",
    applicationDescription:
      "أدخل رقم هاتفك ورأس المال للمراجعة وأي ملاحظات يحتاجها المشرف.",
    phoneLabel: "رقم الهاتف",
    phonePlaceholder: "رقم التواصل المباشر",
    capitalLabel: "رأس المال المبدئي للمراجعة",
    notesLabel: "ملاحظات",
    notesPlaceholder: "أي شيء يجب على المشرف معرفته قبل مراجعة الطلب.",
    submit: "إرسال الطلب",
    submitting: "جاري الإرسال...",
    success: "تم إرسال الطلب وبات الآن بانتظار مراجعة المشرف.",
    failedSubmit: "فشل في إرسال الطلب.",
    phoneCountryPlaceholder: "اختر رمز الدولة",
    phoneRequired: "رقم الهاتف مطلوب.",
  },
} as const;

export default function PublicElitePage({
  lang = "en",
}: {
  lang?: "en" | "ar";
}) {
  const searchParams = useSearchParams();
  const ref = searchParams?.get("ref") ?? null;
  const [status, setStatus] = useState<EliteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mustLogin, setMustLogin] = useState(false);
  const [form, setForm] = useState({
    countryCode: "",
    localPhoneNumber: "",
    investmentAmount: "100000",
    description: "",
  });
  const benefitIcons = [Shield, DollarSign, Clock3, Users, TrendingUp, Eye];
  const t = translations[lang];
  const isArabic = lang === "ar";

  useEffect(() => {
    if (!ref) return;
    fetch("/api/referrals/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: ref }),
    }).catch(() => undefined);
  }, [ref]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/elite/status", { cache: "no-store" });
        if (res.status === 401) {
          setMustLogin(true);
          setStatus({ status: "NONE" });
          return;
        }
        const data = await res.json();
        setStatus(data);
      } catch {
        setStatus({ status: "NONE" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    if (!form.countryCode || !form.localPhoneNumber.trim()) {
      setError(t.phoneRequired);
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/elite/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: buildPhoneNumber(
            form.countryCode,
            form.localPhoneNumber,
          ),
          investmentAmount: Number(form.investmentAmount),
          description: form.description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || t.failedSubmit);

      setMessage(t.success);
      setStatus({ status: "PENDING" });
      setForm((current) => ({
        ...current,
        countryCode: "",
        localPhoneNumber: "",
        investmentAmount: "100000",
        description: "",
      }));
    } catch (err: any) {
      setError(err.message || t.failedSubmit);
    } finally {
      setSaving(false);
    }
  }
  if (loading) return <LoadingBlock label={t.loading} />;

  if (mustLogin) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className={isArabic ? "text-right" : ""}
      >
        <SectionCard title={t.loginTitle} description={t.loginDescription}>
          <Button asChild>
            <Link href={`/${lang}/auth/login`}>{t.loginButton}</Link>
          </Button>
        </SectionCard>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`space-y-8 ${isArabic ? "text-right" : ""}`}
    >
      <HeroPanel
        lang={lang}
        badge={t.heroBadge}
        title={t.heroTitle}
        description={t.heroDescription}
        actions={
          status?.status === "APPROVED" ? (
            <Button
              asChild
              size="lg"
              variant="outline"
              className=" border-white/40 bg-white text-slate-950 shadow-lg shadow-black/20 hover:bg-slate-100"
            >
              <Link href={`/${lang}/elite-group/dashboard`}>
                {t.openDashboard}
              </Link>
            </Button>
          ) : null
        }
      >
        <RoleTimeline items={[...t.timeline]} lang={lang} embedded />
      </HeroPanel>

      <section className="space-y-5">
        <div className={isArabic ? "text-right" : ""}>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            {t.benefitsTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
            {t.benefitsDescription}
          </p>
        </div>

        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {t.benefits.map((item, index) => {
            const Icon = benefitIcons[index];

            return (
              <div
                key={item.title}
                className={`self-start rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  isArabic ? "text-right" : ""
                }`}
              >
                <div
                  className={`mb-3 flex ${isArabic ? "justify-end" : "justify-start"}`}
                >
                  <div className="rounded-xl bg-teal-50 p-3 text-teal-600">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <h3 className="text-base font-semibold leading-7 text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <SectionCard title={t.statusTitle} description={t.statusDescription}>
        <div className={`space-y-4 ${isArabic ? "text-right" : ""}`}>
          <StatusBadge status={status?.status || "NONE"} lang={lang} />

          {ref ? (
            <p className="text-sm text-slate-500">{t.referralDetected}</p>
          ) : null}
        </div>
      </SectionCard>

      {status?.status === "NONE" || status?.status === "REJECTED" ? (
        <SectionCard
          title={t.applicationTitle}
          description={t.applicationDescription}
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <PhoneNumberField
                lang={lang}
                label={t.phoneLabel}
                placeholder={t.phonePlaceholder}
                countryCode={form.countryCode}
                localNumber={form.localPhoneNumber}
                onCountryCodeChange={(value) =>
                  setForm({ ...form, countryCode: value })
                }
                onLocalNumberChange={(value) =>
                  setForm({ ...form, localPhoneNumber: value })
                }
                required
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {t.capitalLabel}
                </label>
                <Input
                  type="number"
                  value={form.investmentAmount}
                  onChange={(e) =>
                    setForm({ ...form, investmentAmount: e.target.value })
                  }
                  min={100000}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t.notesLabel}
              </label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className={`min-h-[130px] rounded-xl border-slate-300 ${isArabic ? "text-right" : ""}`}
                placeholder={t.notesPlaceholder}
                dir={isArabic ? "rtl" : "ltr"}
              />
            </div>

            {message ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={saving}>
              {saving ? t.submitting : t.submit}
            </Button>
          </form>
        </SectionCard>
      ) : null}
    </div>
  );
}
