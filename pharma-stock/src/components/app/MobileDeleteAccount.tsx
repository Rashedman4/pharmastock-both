interface LangProps {
  lang: "en" | "ar";
}

type Section = {
  title: string;
  paragraphs?: string[];
  steps?: string[];
  bullets?: string[];
};

type Translations = {
  title: string;
  intro: string;
  sections: Section[];
};

// Public, app-free page required by Google Play's Data safety form ("Delete
// account URL"): must name the app, prominently show the deletion steps, and
// state what data is deleted vs retained. Mirrors the "Data Retention &
// Account Deletion" section of MobilePrivacyPolicy.tsx — keep both in sync.
const translations: Record<"en" | "ar", Translations> = {
  en: {
    title: "Delete Your Bio Pharma Stock Account",
    intro:
      "You can permanently delete your Bio Pharma Stock account and its associated data at any time. This applies to accounts created on the Bio Pharma Stock mobile app (iOS and Android).",
    sections: [
      {
        title: "How to request deletion",
        steps: [
          "Open the Bio Pharma Stock mobile app and sign in.",
          "Go to the Profile tab, then tap Settings.",
          "Under Account, tap Delete Account.",
          "Confirm the deletion when prompted.",
        ],
        paragraphs: [
          "If you no longer have the app installed or can't sign in, email support@biopharmastock.com from the email address on your account and we will process the deletion request manually.",
        ],
      },
      {
        title: "What gets deleted",
        bullets: [
          "Your personal information — name, phone number, and sign-in credentials — is removed from our active systems.",
          "Push notification tokens and active app sessions are revoked immediately.",
        ],
      },
      {
        title: "What we retain, and for how long",
        bullets: [
          "A minimal record that an account existed and was deleted, and when, is kept internally for record-keeping purposes, for as long as needed for that purpose.",
          "Content tied to services you used on our website — such as subscription or Elite program transaction history — may be retained as required for accounting and legal purposes, but is no longer linked to your identifying information.",
        ],
      },
      {
        title: "More information",
        paragraphs: [
          "See our full Privacy Policy at biopharmastock.com/en/privacy-policy for details on what data we collect and how it's used.",
        ],
      },
    ],
  },
  ar: {
    title: "حذف حسابك في Bio Pharma Stock",
    intro:
      "يمكنك حذف حسابك في Bio Pharma Stock والبيانات المرتبطة به بشكل نهائي في أي وقت. ينطبق هذا على الحسابات التي تم إنشاؤها عبر تطبيق Bio Pharma Stock للجوال (iOS وAndroid).",
    sections: [
      {
        title: "كيفية طلب الحذف",
        steps: [
          "افتح تطبيق Bio Pharma Stock وسجّل الدخول.",
          "انتقل إلى تبويب الملف الشخصي، ثم اضغط على الإعدادات.",
          "ضمن الحساب، اضغط على حذف الحساب.",
          "أكّد عملية الحذف عند مطالبتك بذلك.",
        ],
        paragraphs: [
          "إذا لم يعد التطبيق مثبتًا لديك أو تعذّر عليك تسجيل الدخول، راسلنا عبر support@biopharmastock.com من البريد الإلكتروني المرتبط بحسابك، وسنقوم بمعالجة طلب الحذف يدويًا.",
        ],
      },
      {
        title: "ما الذي يتم حذفه",
        bullets: [
          "تتم إزالة معلوماتك الشخصية — الاسم ورقم الهاتف وبيانات تسجيل الدخول — من أنظمتنا الفعّالة.",
          "يتم إلغاء رموز إشعارات الدفع وجلسات التطبيق النشطة فورًا.",
        ],
      },
      {
        title: "ما الذي نحتفظ به، ولأي مدة",
        bullets: [
          "يتم الاحتفاظ بسجل محدود يفيد بوجود حساب وأنه تم حذفه ووقت الحذف، لأغراض الأرشفة الداخلية فقط، طوال المدة اللازمة لهذا الغرض.",
          "قد يتم الاحتفاظ بأي محتوى مرتبط بالخدمات التي استخدمتها على موقعنا الإلكتروني — مثل سجل معاملات الاشتراك أو برنامج النخبة — وفقًا لمتطلبات المحاسبة والالتزامات القانونية، دون أن يبقى مرتبطًا بمعلوماتك الشخصية المحدِّدة لهويتك.",
        ],
      },
      {
        title: "لمزيد من المعلومات",
        paragraphs: [
          "راجع سياسة الخصوصية الكاملة على biopharmastock.com/ar/privacy-policy للاطلاع على تفاصيل البيانات التي نجمعها وكيفية استخدامها.",
        ],
      },
    ],
  },
};

export default function MobileDeleteAccount({ lang }: LangProps) {
  const t = translations[lang];
  const isArabic = lang === "ar";

  return (
    <div
      className={`container mx-auto py-8 px-4 max-w-3xl ${isArabic ? "text-right" : ""}`}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <h1 className="text-3xl font-bold text-royalBlue mb-4">{t.title}</h1>
      <p className="text-gray-700 mb-8">{t.intro}</p>

      <div className="space-y-8">
        {t.sections.map((section, index) => (
          <div key={index} className="space-y-2">
            <h2 className="text-xl font-semibold text-brightTeal">
              {section.title}
            </h2>
            {section.steps && (
              <ol
                className={`list-decimal space-y-1 text-gray-700 font-medium ${
                  isArabic ? "pr-6" : "pl-6"
                }`}
              >
                {section.steps.map((s, sIndex) => (
                  <li key={sIndex}>{s}</li>
                ))}
              </ol>
            )}
            {section.paragraphs?.map((p, pIndex) => (
              <p key={pIndex} className="text-gray-700">
                {p}
              </p>
            ))}
            {section.bullets && (
              <ul
                className={`list-disc space-y-1 text-gray-700 ${
                  isArabic ? "pr-6" : "pl-6"
                }`}
              >
                {section.bullets.map((b, bIndex) => (
                  <li key={bIndex}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
