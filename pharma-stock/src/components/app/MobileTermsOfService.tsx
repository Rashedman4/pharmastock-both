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
    title: "Terms of Service — Bio Pharma Stock Mobile App",
    lastUpdated: "Last updated: August 16, 2026",
    sections: [
      {
        title: "Acceptance of Terms",
        paragraphs: [
          "By creating an account or using the Bio Pharma Stock mobile app, you agree to these Terms of Service. If you do not agree, please do not use the app.",
        ],
      },
      {
        title: "Eligibility",
        paragraphs: [
          "You must be at least 18 years old to create an account and use Bio Pharma Stock. By using the app, you confirm that you meet this requirement.",
        ],
      },
      {
        title: "Description of Service",
        paragraphs: [
          "The Bio Pharma Stock mobile app provides biopharmaceutical news, breakthrough coverage (FDA designations, clinical trial milestones, and market catalysts), and community/support chat to registered users, for informational and educational purposes only.",
          "Our full research platform — including in-depth research ideas and the Elite managed-portfolio program — is available on our website, biopharmastock.com, which you can reach from within the app via the \"Visit our website\" link. Those services are not part of the mobile app itself and are governed by the terms published on the website.",
        ],
      },
      {
        title: "Not Investment Advice",
        paragraphs: [
          "Nothing in the app — including news, breakthroughs coverage, or support chat — constitutes personalized financial or investment advice. Past performance does not guarantee future results. All investment decisions, and any resulting gains or losses, are your sole responsibility.",
        ],
      },
      {
        title: "Account Registration & Security",
        paragraphs: [
          "You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately if you suspect unauthorized access.",
        ],
      },
      {
        title: "Elite Program & Payments (Website Only)",
        paragraphs: [
          "The Elite Program is a managed-portfolio investment service offered on our website, subject to a separate application and approval process. It is not available within the mobile app. Firm profit-sharing payments owed under the Elite Program are real-world financial settlements, not digital purchases, and are completed entirely on our website. The mobile app does not display Elite portfolio data or process any Elite-related payment.",
        ],
      },
      {
        title: "Subscriptions",
        paragraphs: [
          "Any paid subscription plans, including access to our full research platform, are managed through our website and billed independently of the mobile app. The mobile app itself does not offer in-app purchases or subscription checkout.",
        ],
      },
      {
        title: "Acceptable Use",
        bullets: [
          "Do not use the app for any unlawful purpose or in violation of any applicable regulation.",
          "Do not attempt to interfere with, disrupt, or gain unauthorized access to our systems.",
          "Do not misuse the community chat, support chat, or upload features to transmit harmful, abusive, or infringing content.",
        ],
      },
      {
        title: "Intellectual Property",
        paragraphs: [
          "All content, branding, and materials provided through the app are owned by or licensed to Bio Pharma Stock and may not be copied, redistributed, or used commercially without our written permission.",
        ],
      },
      {
        title: "Account Termination",
        paragraphs: [
          "You may delete your account at any time from Settings → Account → Delete Account. We may suspend or terminate accounts that violate these Terms.",
        ],
      },
      {
        title: "Disclaimer of Warranties & Limitation of Liability",
        paragraphs: [
          "The app and its content are provided \"as is\" without warranties of any kind. To the fullest extent permitted by law, Bio Pharma Stock is not liable for any investment losses, trading decisions, or damages arising from your use of the app.",
        ],
      },
      {
        title: "Changes to These Terms",
        paragraphs: [
          "We may update these Terms from time to time. Continued use of the app after an update constitutes acceptance of the revised Terms.",
        ],
      },
      {
        title: "Contact Us",
        paragraphs: [
          "If you have questions about these Terms of Service, contact us at support@biopharmastock.com.",
        ],
      },
    ],
  },
  ar: {
    title: "شروط الخدمة — تطبيق Bio Pharma Stock",
    lastUpdated: "آخر تحديث: 16 أغسطس 2026",
    sections: [
      {
        title: "قبول الشروط",
        paragraphs: [
          "بإنشائك حسابًا أو استخدامك لتطبيق Bio Pharma Stock، فإنك توافق على شروط الخدمة هذه. إذا كنت لا توافق، يرجى عدم استخدام التطبيق.",
        ],
      },
      {
        title: "الأهلية",
        paragraphs: [
          "يجب أن يكون عمرك 18 عامًا على الأقل لإنشاء حساب واستخدام Bio Pharma Stock. باستخدامك للتطبيق، فإنك تؤكد استيفاءك لهذا الشرط.",
        ],
      },
      {
        title: "وصف الخدمة",
        paragraphs: [
          "يقدّم تطبيق Bio Pharma Stock للجوال أخبارًا في مجال الأدوية الحيوية، وتغطية للابتكارات (كالتصنيفات التنظيمية لإدارة الغذاء والدواء الأمريكية، ومحطات التجارب السريرية، ومحفزات السوق)، ومحادثة مجتمع ودعم للمستخدمين المسجّلين، وذلك لأغراض إعلامية وتعليمية فقط.",
          "تتوفر منصتنا البحثية الكاملة — بما في ذلك الأفكار البحثية المتعمّقة وبرنامج النخبة للمحفظة المُدارة — على موقعنا الإلكتروني biopharmastock.com، ويمكن الوصول إليه من داخل التطبيق عبر رابط \"زيارة موقعنا\". هذه الخدمات ليست جزءًا من تطبيق الجوال نفسه وتخضع للشروط المنشورة على الموقع الإلكتروني.",
        ],
      },
      {
        title: "ليست استشارة استثمارية",
        paragraphs: [
          "لا يُشكّل أي محتوى داخل التطبيق — بما في ذلك الأخبار أو تغطية الابتكارات أو محادثة الدعم — استشارة مالية أو استثمارية شخصية. الأداء السابق لا يضمن نتائج مستقبلية. جميع قرارات الاستثمار، وأي أرباح أو خسائر ناتجة عنها، هي مسؤوليتك وحدك.",
        ],
      },
      {
        title: "تسجيل الحساب وأمانه",
        paragraphs: [
          "أنت مسؤول عن الحفاظ على سرية بيانات حسابك وعن جميع الأنشطة التي تتم من خلاله. يرجى إبلاغنا فورًا إذا اشتبهت بوصول غير مصرح به.",
        ],
      },
      {
        title: "برنامج النخبة والمدفوعات (عبر الموقع الإلكتروني فقط)",
        paragraphs: [
          "برنامج النخبة هو خدمة استثمار بمحفظة مُدارة تُقدَّم عبر موقعنا الإلكتروني، وتخضع لعملية تقديم وموافقة منفصلة. وهو غير متاح داخل تطبيق الجوال. مدفوعات حصة أرباح الشركة المستحقة بموجب برنامج النخبة هي تسويات مالية حقيقية، وليست عمليات شراء رقمية، وتتم بالكامل عبر موقعنا الإلكتروني. لا يعرض تطبيق الجوال بيانات محفظة النخبة ولا يعالج أي دفعة متعلقة بها.",
        ],
      },
      {
        title: "الاشتراكات",
        paragraphs: [
          "تُدار أي خطط اشتراك مدفوعة، بما في ذلك الوصول إلى منصتنا البحثية الكاملة، عبر موقعنا الإلكتروني ويتم إصدار فواتيرها بشكل مستقل عن تطبيق الجوال. لا يوفر تطبيق الجوال حاليًا عمليات شراء داخل التطبيق أو إتمام اشتراك من داخله.",
        ],
      },
      {
        title: "الاستخدام المقبول",
        bullets: [
          "لا تستخدم التطبيق لأي غرض غير قانوني أو بما يخالف أي تنظيم معمول به.",
          "لا تحاول التدخل في أنظمتنا أو تعطيلها أو الوصول إليها دون تصريح.",
          "لا تسيء استخدام محادثة المجتمع أو محادثة الدعم أو ميزات الرفع لإرسال محتوى ضار أو مسيء أو منتهك لحقوق الآخرين.",
        ],
      },
      {
        title: "الملكية الفكرية",
        paragraphs: [
          "جميع المحتويات والعلامات والمواد المقدَّمة عبر التطبيق مملوكة لـ Bio Pharma Stock أو مرخّصة لها، ولا يجوز نسخها أو إعادة توزيعها أو استخدامها تجاريًا دون إذن كتابي منا.",
        ],
      },
      {
        title: "إنهاء الحساب",
        paragraphs: [
          "يمكنك حذف حسابك في أي وقت من الإعدادات ← الحساب ← حذف الحساب. يجوز لنا تعليق أو إنهاء الحسابات التي تخالف هذه الشروط.",
        ],
      },
      {
        title: "إخلاء المسؤولية عن الضمانات وتحديد المسؤولية",
        paragraphs: [
          "يُقدَّم التطبيق ومحتواه \"كما هو\" دون أي ضمانات من أي نوع. وإلى أقصى حد يسمح به القانون، لا يتحمل Bio Pharma Stock المسؤولية عن أي خسائر استثمارية أو قرارات تداول أو أضرار ناتجة عن استخدامك للتطبيق.",
        ],
      },
      {
        title: "التغييرات على هذه الشروط",
        paragraphs: [
          "قد نقوم بتحديث هذه الشروط من وقت لآخر. يُعد استمرارك في استخدام التطبيق بعد أي تحديث موافقة منك على الشروط المعدَّلة.",
        ],
      },
      {
        title: "تواصل معنا",
        paragraphs: [
          "إذا كانت لديك أسئلة حول شروط الخدمة هذه، تواصل معنا عبر support@biopharmastock.com.",
        ],
      },
    ],
  },
};

export default function MobileTermsOfService({ lang }: LangProps) {
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
