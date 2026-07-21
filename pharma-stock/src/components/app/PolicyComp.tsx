"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
interface LangProps {
  lang: "en" | "ar";
}
type Subsection = {
  title: string;
  content: string;
};

type Section = {
  title: string;
  subsections: Subsection[];
};

type Translations = {
  title: string;
  acceptButton: string;
  accepted: string;
  sections: Section[];
};

const translations: Record<"en" | "ar", Translations> = {
  en: {
    title: "Terms and Conditions",
    acceptButton: "Accept Terms & Conditions",
    accepted: "Terms & Conditions Accepted",
    sections: [
      {
        title: "1. Terms and Conditions",
        subsections: [
          {
            title: "1.1 Acceptance of Terms",
            content:
              "By accessing and using Bio Pharma Stock, you agree to abide by these Terms and Conditions. If you do not agree with any part of these terms, please do not use the application.",
          },
          {
            title: "1.2 Services Provided",
            content:
              "Bio Pharma Stock is a specialized biopharma research intelligence company. We provide stock insights, news, daily video updates, stock analysis, and subscription-based content related to the US pharmaceutical stock market.",
          },
          {
            title: "1.3 User Responsibilities",
            content:
              "You acknowledge that all stock signals and ideas are based on our internal research and analysis. You must conduct your own research before making any investment decisions. Bio Pharma Stock does not guarantee the accuracy, reliability, or completeness of any provided information. You are solely responsible for any financial loss resulting from the use of our signals or stock insights. You must not use our services for any illegal, fraudulent, or unauthorized purposes.",
          },
        ],
      },
      /*      {
        title: "2. Payment & Subscription Policy",
        subsections: [
          {
            title: "2.1 Subscription Plans",
            content:
              "Bio Pharma Stock operates on a subscription model. Users must choose a plan to access premium content. Subscription fees are displayed clearly before purchase and are subject to change at our discretion.",
          },
          {
            title: "2.2 Payment Terms",
            content:
              "Payments are processed securely through third-party payment providers. By subscribing, you authorize Bio Pharma Stock to charge your payment method for the selected plan.",
          },
             {
            title: "2.3 Auto-Renewal",
            content:
              "Subscriptions automatically renew unless canceled before the renewal date. You can cancel your subscription at any time from your account settings.",
          }, 
          {
            title: "2.3 Refund Policy",
            content:
              "No refunds will be issued once a subscription is purchased. If you experience billing issues, contact our support team for assistance.",
          },
        ],
      }, */
      {
        title: "2. Risk Disclaimer",
        subsections: [
          {
            title: "2.1 Investment Risks",
            content:
              "Investing in stocks involves risks, including potential financial loss. Bio Pharma Stock provides educational content and stock insights; we do not provide financial advice. We do not guarantee any specific financial outcomes or profits. You should consult a licensed financial advisor before making any investment decisions.",
          },
        ],
      },
      {
        title: "3. Privacy Policy",
        subsections: [
          {
            title: "3.1 Information We Collect",
            content:
              "We collect user data, including name, email, and app usage behavior. Personal data is stored securely and used to improve our services.",
          },
          {
            title: "3.2 How We Use Your Data",
            content:
              "To provide stock signals, news, and personalized recommendations. To manage subscriptions. To communicate with you regarding updates, offers, or support inquiries.",
          },
          {
            title: "3.3 Third-Party Sharing",
            content:
              "We do not sell user data to third parties. Data may be shared with trusted service providers (e.g., payment processors) to facilitate our services.",
          },
          {
            title: "3.4 Cookies & Tracking",
            content:
              "We use cookies to enhance user experience and analyze traffic. You can manage cookie preferences in your browser settings.",
          },
        ],
      },
      {
        title: "4. User Conduct",
        subsections: [
          {
            title: "4.1 Acceptable Use",
            content:
              "You agree not to copy, distribute, or misuse our stock signals and content. Any misuse of our platform, including sharing paid content without authorization, may result in account suspension.",
          },
        ],
      },
      {
        title: "5. Limitation of Liability",
        subsections: [
          {
            title: "5.1 Liability Disclaimer",
            content:
              "Bio Pharma Stock is not liable for any financial losses, investment decisions, or damages incurred through the use of our platform. We do not guarantee that the service will be available without interruptions, errors, or delays.",
          },
        ],
      },
      {
        title: "6. Modifications to Policies",
        subsections: [
          {
            title: "6.1 Policy Changes",
            content:
              "Bio Pharma Stock reserves the right to modify these policies at any time. We will notify users of major changes via email or app notifications.",
          },
        ],
      },
      {
        title: "7. Contact Information",
        subsections: [
          {
            title: "7.1 Contact Details",
            content:
              "If you have any questions about our policies, contact us at: 📧 support@biopharmastock.com",
          },
        ],
      },
    ],
  },
  ar: {
    title: "الشروط والأحكام",
    acceptButton: "قبول الشروط والأحكام",
    accepted: "تم قبول الشروط والأحكام",
    sections: [
      {
        title: "1. القبول بالشروط",
        subsections: [
          {
            title: "1.1 قبول الشروط",
            content:
              "من خلال الوصول إلى واستخدام Bio Pharma Stock، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يُرجى عدم استخدام التطبيق.",
          },
          {
            title: "1.2 الخدمات المقدمة",
            content:
              "Bio Pharma Stock شركة متخصصة تقدّم رؤى بحثية لقطاع الأدوية الحيوية. نقدم رؤى الأسهم، والأخبار، والتحديثات اليومية بالفيديو، وتحليلات الأسهم، والمحتوى القائم على الاشتراك المتعلق بسوق الأسهم الأمريكية في قطاع الأدوية.",
          },
          {
            title: "1.3 مسؤوليات المستخدم",
            content:
              "تقر بأن جميع إشارات الأسهم والأفكار تعتمد على دراساتنا الداخلية وتحليلاتنا. يجب عليك إجراء أبحاثك الخاصة قبل اتخاذ أي قرارات استثمارية. لا يضمن Bio Pharma Stock دقة أو موثوقية أو اكتمال أي من المعلومات المقدمة. أنت وحدك المسؤول عن أي خسائر مالية ناتجة عن استخدام إشاراتنا أو تحليلاتنا. لا يجوز لك استخدام خدماتنا لأي أغراض غير قانونية أو احتيالية أو غير مصرح بها.",
          },
        ],
      },
      /*       {
        title: "2. سياسة الدفع والاشتراك",
        subsections: [
          {
            title: "2.1 خطط الاشتراك",
            content:
              "يعمل Bio Pharma Stock بنظام الاشتراك، ويجب على المستخدمين اختيار خطة للوصول إلى المحتوى المتميز. يتم عرض رسوم الاشتراك بوضوح قبل الشراء، وهي قابلة للتغيير وفقًا لتقديرنا.",
          },
          {
            title: "2.2 شروط الدفع",
            content:
              "تتم معالجة المدفوعات بشكل آمن من خلال مزودي خدمات الدفع المعتمدين. من خلال الاشتراك، فإنك تمنح Bio Pharma Stock الإذن بخصم الرسوم من وسيلة الدفع الخاصة بك وفقًا للخطة المختارة.",
          },
            {
            title: "2.3 التجديد التلقائي",
            content:
              "يتم تجديد الاشتراكات تلقائيًا ما لم يتم إلغاؤها قبل تاريخ التجديد. يمكنك إلغاء الاشتراك في أي وقت من خلال إعدادات حسابك.",
          }, 
          {
            title: "2.3 سياسة الاسترداد",
            content:
              "لا يتم استرداد الرسوم بعد شراء الاشتراك. في حال واجهت مشكلات في الدفع، يُرجى التواصل مع فريق الدعم لدينا للحصول على المساعدة.",
          },
        ],
      }, */
      {
        title: "2. إخلاء المسؤولية عن المخاطر",
        subsections: [
          {
            title: "2.1 تحذير المخاطر",
            content:
              "الاستثمار في الأسهم ينطوي على مخاطر، بما في ذلك احتمال الخسائر المالية. Bio Pharma Stock يقدم محتوى تعليميًا وتحليلات للأسهم فقط ولا يقدم استشارات مالية. لا نضمن أي نتائج مالية أو أرباح محددة. يجب عليك استشارة مستشار مالي مرخص قبل اتخاذ أي قرارات استثمارية.",
          },
        ],
      },
      {
        title: "3. سياسة الخصوصية",
        subsections: [
          {
            title: "3.1 المعلومات التي نقوم بجمعها",
            content:
              "نقوم بجمع بيانات المستخدم، بما في ذلك الاسم، البريد الإلكتروني، وسلوك الاستخدام داخل التطبيق. يتم تخزين البيانات الشخصية بشكل آمن واستخدامها لتحسين خدماتنا.",
          },
          {
            title: "3.2 كيفية استخدام بياناتك",
            content:
              "لتقديم إشارات الأسهم، الأخبار، والتوصيات المخصصة. لإدارة الاشتراكات. للتواصل معك بشأن التحديثات والعروض واستفسارات الدعم.",
          },
          {
            title: "3.3 مشاركة البيانات مع أطراف ثالثة",
            content:
              "لا نقوم ببيع بيانات المستخدم لأي أطراف خارجية. قد تتم مشاركة البيانات مع مزودي الخدمات الموثوقين (مثل معالجي الدفع) لتقديم خدماتنا.",
          },
          {
            title: "3.4 ملفات تعريف الارتباط والتتبع",
            content:
              "نستخدم ملفات تعريف الارتباط لتحسين تجربة المستخدم وتحليل حركة المرور. يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال إعدادات المتصفح لديك.",
          },
        ],
      },
      {
        title: "4. سلوك المستخدم",
        subsections: [
          {
            title: "4.1 قواعد الاستخدام",
            content:
              "يُحظر نسخ أو توزيع أو إساءة استخدام إشارات الأسهم أو المحتوى الخاص بنا. أي إساءة استخدام لمنصتنا، بما في ذلك مشاركة المحتوى المدفوع دون إذن، قد تؤدي إلى تعليق الحساب.",
          },
        ],
      },
      {
        title: "5. تحديد المسؤولية",
        subsections: [
          {
            title: "5.1 حدود المسؤولية",
            content:
              "Bio Pharma Stock غير مسؤول عن أي خسائر مالية أو قرارات استثمارية أو أضرار ناتجة عن استخدام منصتنا. لا نضمن أن الخدمة ستكون متاحة بدون انقطاعات أو أخطاء أو تأخير.",
          },
        ],
      },
      {
        title: "6. تعديلات السياسات",
        subsections: [
          {
            title: "6.1 حق التعديل",
            content:
              "نحتفظ بالحق في تعديل هذه السياسات في أي وقت. سيتم إخطار المستخدمين بالتغييرات الرئيسية عبر البريد الإلكتروني أو إشعارات التطبيق.",
          },
        ],
      },
      {
        title: "7. معلومات الاتصال",
        subsections: [
          {
            title: "7.1 تواصل معنا",
            content:
              "إذا كان لديك أي استفسارات حول سياساتنا، يمكنك التواصل معنا عبر البريد الإلكتروني: 📧 support@biopharmastock.com",
          },
        ],
      },
    ],
  },
};

export default function PolicyComp({ lang }: LangProps) {
  const [isAccepted, setIsAccepted] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    const policyAccepted = Cookies.get("policyAccepted");
    setIsAccepted(!!policyAccepted);
  }, []);

  const handleAccept = () => {
    Cookies.set("policyAccepted", "true", { expires: 365 });
    setIsAccepted(true);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-royalBlue mb-8">{t.title}</h1>

      <div className="space-y-8 mb-12">
        {t.sections.map((section, index) => (
          <div key={index} className="space-y-4">
            <h2 className="text-2xl font-semibold text-brightTeal">
              {section.title}
            </h2>
            {section.subsections.map((subsection, subIndex) => (
              <div key={subIndex} className="ml-4 space-y-2">
                <h3 className="text-xl font-medium text-royalBlue">
                  {subsection.title}
                </h3>
                <p className="text-gray-600">{subsection.content}</p>
              </div>
            ))}
          </div>
        ))}
      </div>

      {!isAccepted && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 shadow-lg border-t">
          <div className="container mx-auto flex justify-center">
            <Button
              onClick={handleAccept}
              className="bg-brightTeal hover:bg-royalBlue text-white"
            >
              {t.acceptButton}
            </Button>
          </div>
        </div>
      )}

      {isAccepted && (
        <div className="text-center text-green-600 font-medium">
          {t.accepted}
        </div>
      )}
    </div>
  );
}
