interface LangProps {
  lang: "en" | "ar";
}

type Section = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type Translations = {
  title: string;
  lastUpdated: string;
  sections: Section[];
};

const translations: Record<"en" | "ar", Translations> = {
  en: {
    title: "Privacy Policy — BioPharmaStock Mobile App",
    lastUpdated: "Last updated: July 18, 2026",
    sections: [
      {
        title: "Introduction",
        paragraphs: [
          "This Privacy Policy describes how BioPharmaStock (\"we\", \"us\") collects, uses, and protects your information when you use the BioPharmaStock mobile app on iOS and Android.",
        ],
      },
      {
        title: "Information We Collect",
        bullets: [
          "Account information: your email address, first and last name, and phone number when you create an account.",
          "Camera: used to capture trade evidence photos for the Elite investment program and to share images in community chat. We do not use the camera for any other purpose.",
          "Photo library: used to upload existing photos as trade evidence or in chat.",
          "Microphone: used to record and send voice messages in community chat.",
          "Push notification data: a device push token is stored so we can deliver notifications about your ideas/signals, chat messages, and account updates.",
          "Usage data: we log which screens you visit within the app to understand usage and improve the product. This data is used internally only and is not shared with third parties.",
        ],
      },
      {
        title: "Third-Party Services",
        paragraphs: [
          "We work with the following third-party services, each of which processes data under its own privacy policy in addition to ours:",
        ],
        bullets: [
          "Firebase (Google) — used to deliver push notifications to Android devices.",
          "Google Sign-In — if you choose to sign in with Google, we receive your name and email from Google to create or access your account.",
          "Apple Sign In — if you choose to sign in with Apple, we receive the information Apple provides (your email, and your name on first sign-in) to create or access your account.",
          "Cloudinary — a secure file-storage provider used to store images, voice messages, and documents you upload.",
        ],
      },
      {
        title: "Data Retention & Account Deletion",
        paragraphs: [
          "You can permanently delete your account at any time from Settings → Account → Delete Account within the app. When you delete your account:",
        ],
        bullets: [
          "Your personal information (name, phone number, sign-in credentials) is removed from our active systems.",
          "A minimal record that an account existed and was deleted, and when, is kept internally for record-keeping purposes.",
          "Content tied to services you used (such as subscription or Elite program transaction history) may be retained as required for accounting and legal purposes, but is no longer linked to your identifying information.",
        ],
      },
      {
        title: "Children's Privacy",
        paragraphs: [
          "BioPharmaStock is intended for users who are 18 years of age or older. Our app provides financial and investment-related content and is not directed at children. We do not knowingly collect personal information from anyone under 18. If you believe a child has provided us with personal information, please contact us and we will delete it.",
        ],
      },
      {
        title: "Investment Disclaimer",
        paragraphs: [
          "BioPharmaStock provides research, signals, and insights for educational and informational purposes. We do not provide personalized financial advice. All investment decisions are your own responsibility, and we do not guarantee any specific outcomes.",
        ],
      },
      {
        title: "Your Rights",
        paragraphs: [
          "Depending on your location, you may have the right to access the personal data we hold about you, request corrections, or request deletion (see \"Data Retention & Account Deletion\" above). To exercise any of these rights, contact us at support@biopharmastock.com.",
        ],
      },
      {
        title: "Contact Us",
        paragraphs: [
          "If you have questions about this Privacy Policy or how we handle your data, contact us at support@biopharmastock.com.",
        ],
      },
    ],
  },
  ar: {
    title: "سياسة الخصوصية — تطبيق BioPharmaStock",
    lastUpdated: "آخر تحديث: 18 يوليو 2026",
    sections: [
      {
        title: "مقدمة",
        paragraphs: [
          "توضح سياسة الخصوصية هذه كيفية قيام BioPharmaStock (\"نحن\") بجمع معلوماتك واستخدامها وحمايتها عند استخدامك لتطبيق BioPharmaStock على أنظمة iOS وAndroid.",
        ],
      },
      {
        title: "المعلومات التي نجمعها",
        bullets: [
          "معلومات الحساب: بريدك الإلكتروني، اسمك الأول واسم العائلة، ورقم هاتفك عند إنشاء حسابك.",
          "الكاميرا: تُستخدم لالتقاط صور إثبات الصفقات لبرنامج إيليت الاستثماري ولمشاركة الصور في محادثات المجتمع. لا نستخدم الكاميرا لأي غرض آخر.",
          "مكتبة الصور: تُستخدم لرفع صور موجودة مسبقًا كإثبات للصفقات أو في المحادثة.",
          "الميكروفون: يُستخدم لتسجيل وإرسال الرسائل الصوتية في محادثات المجتمع.",
          "بيانات الإشعارات: يتم تخزين رمز إشعارات الجهاز لتمكيننا من إرسال الإشعارات المتعلقة بالأفكار والرسائل وتحديثات الحساب.",
          "بيانات الاستخدام: نسجّل الشاشات التي تزورها داخل التطبيق لفهم أنماط الاستخدام وتحسين المنتج. تُستخدم هذه البيانات داخليًا فقط ولا تتم مشاركتها مع أي طرف ثالث.",
        ],
      },
      {
        title: "خدمات الطرف الثالث",
        paragraphs: [
          "نتعامل مع مزودي الخدمات التالية، ويقوم كل منهم بمعالجة البيانات وفقًا لسياسة الخصوصية الخاصة به بالإضافة إلى سياستنا:",
        ],
        bullets: [
          "Firebase (من Google) — تُستخدم لإرسال إشعارات الدفع لأجهزة Android.",
          "تسجيل الدخول عبر Google — عند اختيارك تسجيل الدخول عبر Google، نستلم اسمك وبريدك الإلكتروني من Google لإنشاء حسابك أو الوصول إليه.",
          "تسجيل الدخول عبر Apple — عند اختيارك تسجيل الدخول عبر Apple، نستلم المعلومات التي توفرها Apple (بريدك الإلكتروني، واسمك عند أول تسجيل دخول) لإنشاء حسابك أو الوصول إليه.",
          "Cloudinary — مزود تخزين ملفات آمن نستخدمه لتخزين الصور والرسائل الصوتية والمستندات التي تقوم برفعها.",
        ],
      },
      {
        title: "الاحتفاظ بالبيانات وحذف الحساب",
        paragraphs: [
          "يمكنك حذف حسابك بشكل نهائي في أي وقت من الإعدادات ← الحساب ← حذف الحساب داخل التطبيق. عند حذف حسابك:",
        ],
        bullets: [
          "تتم إزالة معلوماتك الشخصية (الاسم، رقم الهاتف، بيانات تسجيل الدخول) من أنظمتنا الفعّالة.",
          "يتم الاحتفاظ بسجل محدود يفيد بوجود حساب وأنه تم حذفه ووقت الحذف، لأغراض الأرشفة الداخلية فقط.",
          "قد يتم الاحتفاظ بأي محتوى مرتبط بالخدمات التي استخدمتها (مثل سجل معاملات الاشتراك أو برنامج إيليت) وفقًا لمتطلبات المحاسبة والالتزامات القانونية، دون أن يبقى مرتبطًا بمعلوماتك الشخصية المحدِّدة لهويتك.",
        ],
      },
      {
        title: "خصوصية الأطفال",
        paragraphs: [
          "تطبيق BioPharmaStock مخصص للمستخدمين البالغين 18 عامًا فأكثر. يقدّم تطبيقنا محتوى ماليًا واستثماريًا وهو غير موجّه للأطفال. نحن لا نجمع عن قصد أي معلومات شخصية من أي شخص دون سن 18 عامًا. إذا كنت تعتقد أن طفلاً قد زوّدنا بمعلومات شخصية، يُرجى التواصل معنا وسنقوم بحذفها.",
        ],
      },
      {
        title: "إخلاء المسؤولية الاستثمارية",
        paragraphs: [
          "يقدّم BioPharmaStock أبحاثًا وإشارات ورؤى لأغراض تعليمية وإعلامية. نحن لا نقدّم استشارات مالية شخصية. جميع قرارات الاستثمار هي مسؤوليتك الخاصة، ولا نضمن تحقيق أي نتائج محددة.",
        ],
      },
      {
        title: "حقوقك",
        paragraphs: [
          "بحسب موقعك، قد يكون لديك الحق في الوصول إلى بياناتك الشخصية التي نحتفظ بها، أو طلب تصحيحها، أو طلب حذفها (راجع \"الاحتفاظ بالبيانات وحذف الحساب\" أعلاه). لممارسة أي من هذه الحقوق، تواصل معنا عبر support@biopharmastock.com.",
        ],
      },
      {
        title: "تواصل معنا",
        paragraphs: [
          "إذا كانت لديك أسئلة حول سياسة الخصوصية هذه أو كيفية تعاملنا مع بياناتك، تواصل معنا عبر support@biopharmastock.com.",
        ],
      },
    ],
  },
};

export default function MobilePrivacyPolicy({ lang }: LangProps) {
  const t = translations[lang];
  const isArabic = lang === "ar";

  return (
    <div
      className={`container mx-auto py-8 px-4 max-w-3xl ${isArabic ? "text-right" : ""}`}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <h1 className="text-3xl font-bold text-royalBlue mb-2">{t.title}</h1>
      <p className="text-sm text-gray-500 mb-8">{t.lastUpdated}</p>

      <div className="space-y-8">
        {t.sections.map((section, index) => (
          <div key={index} className="space-y-2">
            <h2 className="text-xl font-semibold text-brightTeal">
              {section.title}
            </h2>
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
