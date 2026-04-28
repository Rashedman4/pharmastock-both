"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  HeroPanel,
  LoadingBlock,
  SectionCard,
  StatusBadge,
} from "@/components/program/shared";
import {
  PhoneNumberField,
  buildPhoneNumber,
  splitPhoneNumber,
} from "@/components/program/PhoneNumberField";
interface PartnerAccount {
  status?: string;
  displayName?: string;
  phoneNumber?: string;
  bio?: string;
  referralCode?: string | null;
  reviewNote?: string | null;
}

export default function PartnerApplyPage({
  lang = "en",
}: {
  lang?: "en" | "ar";
}) {
  const [account, setAccount] = useState<PartnerAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mustLogin, setMustLogin] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    countryCode: "",
    localPhoneNumber: "",
    bio: "",
  });
  const isArabic = lang === "ar";

  const t = isArabic
    ? {
        loading: "جاري تحميل طلب الشريك...",
        loginRequiredTitle: "تسجيل الدخول مطلوب",
        loginRequiredDescription: "تحتاج إلى جلسة حساب قبل التقديم كشريك.",
        logInFirst: "سجّل الدخول أولاً",
        approvedBadge: "تمت الموافقة على الشريك",
        approvedTitle: "تمت الموافقة عليك بالفعل كشريك.",
        approvedDescription:
          "تم إخفاء نموذج الطلب لأن إعادة إرسال حساب شريك معتمد أمر بلا معنى. استخدم لوحة التحكم وصفحات العملاء بدلًا من ذلك.",
        openDashboard: "فتح لوحة التحكم",
        openClients: "فتح العملاء",
        currentStatus: "الحالة الحالية",
        displayName: "الاسم الظاهر",
        phoneNumber: "رقم الهاتف",
        appBadge: "طلب الشريك",
        appTitle: "قدّم مرة واحدة. اجعلها بسيطة.",
        appDescription:
          "الطلب الآن يطلب الحد الأدنى الذي يهم فعلاً: الاسم الظاهر، رقم الهاتف، ووصف قصير عنك.",
        resubmitNote:
          "إذا تم رفضك أو إيقافك سابقًا، يمكنك إعادة التقديم من هنا. ذلك السلوك الميت والمكسور انتهى.",
        adminNote: "ملاحظة الإدارة",
        formTitle: "معلومات الشريك",

        displayNameLabel: "الاسم الظاهر",
        displayNamePlaceholder: "كيف تريد أن نظهرك علنًا؟",
        phoneNumberLabel: "رقم الهاتف",
        phoneNumberPlaceholder: "واتساب أو الرقم المباشر",
        bioLabel: "نبذة عنك",
        bioPlaceholder:
          "من أنت، كيف تعمل مع المستثمرين، ولماذا ينبغي أن نوافق عليك؟",
        savedMessage: "تم حفظ الطلب. المراجعة من الإدارة مطلوبة الآن.",
        submitError: "فشل في إرسال الطلب.",
        saveError: "فشل في حفظ الطلب.",
        saving: "جاري الحفظ...",
        submitApplication: "إرسال الطلب",
        phoneRequired: "رقم الهاتف مطلوب.",
      }
    : {
        loading: "Loading partner application...",
        loginRequiredTitle: "Login required",
        loginRequiredDescription:
          "You need an account session before applying as a partner.",
        logInFirst: "Log in first",
        approvedBadge: "Partner approved",
        approvedTitle: "You are already approved as a partner.",
        approvedDescription:
          "The application form is hidden because resubmitting an approved partner account is pointless. Use the dashboard and clients pages instead.",
        openDashboard: "Open dashboard",
        openClients: "Open clients",
        currentStatus: "Current status",
        displayName: "Display name",
        phoneNumber: "Phone number",
        appBadge: "Partner application",
        appTitle: "Apply once. Keep it simple.",
        appDescription:
          "Your application now asks for the bare minimum that actually matters: display name, phone number, and a short description of who you are.",
        resubmitNote:
          "If you were rejected or suspended before, you can resubmit here. That broken dead-end behavior is gone.",
        adminNote: "Admin note",
        formTitle: "Partner information",

        displayNameLabel: "Display name",
        displayNamePlaceholder: "How should we show you publicly?",
        phoneNumberLabel: "Phone number",
        phoneNumberPlaceholder: "WhatsApp or direct number",
        bioLabel: "About you",
        bioPlaceholder:
          "Who are you, how do you work with investors, and why should we approve you?",
        savedMessage: "Application saved. Admin review is now required.",
        submitError: "Failed to submit application.",
        saveError: "Failed to save application.",
        saving: "Saving...",
        phoneRequired: "Phone number is required.",
        submitApplication: "Submit application",
      };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/partners/me", { cache: "no-store" });
        if (res.status === 401) {
          setMustLogin(true);
          return;
        }
        const data = await res.json();
        if (data?.status && data.status !== "NONE") {
          setAccount(data);
          const parsedPhone = splitPhoneNumber(data.phoneNumber);

          setForm({
            displayName: data.displayName || "",
            countryCode: parsedPhone.countryCode,
            localPhoneNumber: parsedPhone.localNumber,
            bio: data.bio || "",
          });
        }
      } catch (err) {
        console.error(err);
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
      const res = await fetch("/api/partners/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          phoneNumber: buildPhoneNumber(
            form.countryCode,
            form.localPhoneNumber,
          ),
          bio: form.bio,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || t.submitError);

      setMessage(t.savedMessage);
      setAccount((current) => ({
        ...(current || {}),
        status: data.status || "PENDING",
        displayName: form.displayName,
        phoneNumber: buildPhoneNumber(form.countryCode, form.localPhoneNumber),
        bio: form.bio,
      }));
    } catch (err: any) {
      setError(err.message || t.saveError);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock label={t.loading} />;
  if (account?.status === "APPROVED") {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className={`space-y-8 ${isArabic ? "text-right" : ""}`}
      >
        <HeroPanel
          lang={lang}
          badge={t.approvedBadge}
          title={t.approvedTitle}
          description={t.approvedDescription}
          actions={
            <>
              <Button asChild size="lg">
                <Link href={`/${lang}/partners/dashboard`}>
                  {t.openDashboard}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={`/${lang}/partners/clients`}>{t.openClients}</Link>
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-sm text-slate-200">
            <div>
              <p className="font-semibold">{t.currentStatus}</p>
              <div className="mt-2">
                <StatusBadge status={account.status} lang={lang} />
              </div>
            </div>
            <p>
              {t.displayName}: {account.displayName || "—"}
            </p>
            <p>
              {t.phoneNumber}:{" "}
              <span dir="ltr" className="inline-block text-left">
                {account.phoneNumber || "—"}
              </span>
            </p>
          </div>
        </HeroPanel>
      </div>
    );
  }
  if (mustLogin)
    return (
      <SectionCard
        title={t.loginRequiredTitle}
        description={t.loginRequiredDescription}
      >
        <Button asChild>
          <Link href={`/${lang}/auth/login`}>{t.logInFirst}</Link>
        </Button>
      </SectionCard>
    );

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`space-y-8 ${isArabic ? "text-right" : ""}`}
    >
      <HeroPanel
        lang={lang}
        badge={t.appBadge}
        title={t.appTitle}
        description={t.appDescription}
      >
        <div className="space-y-4 text-sm text-slate-200">
          <div>
            <p className="font-semibold">{t.currentStatus}</p>
            <div className="mt-2">
              <StatusBadge status={account?.status || "NONE"} lang={lang} />
            </div>
          </div>
          <p>{t.resubmitNote}</p>
          {account?.reviewNote ? (
            <p className="rounded-xl border border-white/10 bg-white/5 p-3">
              {t.adminNote}: {account.reviewNote}
            </p>
          ) : null}
        </div>
      </HeroPanel>

      <SectionCard title={t.formTitle}>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t.displayNameLabel}
              </label>
              <Input
                dir={isArabic ? "rtl" : "ltr"}
                className={isArabic ? "text-right" : ""}
                value={form.displayName}
                onChange={(e) =>
                  setForm({ ...form, displayName: e.target.value })
                }
                placeholder={t.displayNamePlaceholder}
              />
            </div>
            <PhoneNumberField
              lang={lang}
              label={t.phoneNumberLabel}
              placeholder={t.phoneNumberPlaceholder}
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
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {t.bioLabel}
            </label>
            <Textarea
              dir={isArabic ? "rtl" : "ltr"}
              className={`min-h-[140px] ${isArabic ? "text-right" : ""}`}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder={t.bioPlaceholder}
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
          <div
            className={`flex flex-wrap gap-3 ${isArabic ? "justify-start md:justify-end" : ""}`}
          >
            <Button type="submit" disabled={saving}>
              {saving ? t.saving : t.submitApplication}
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
