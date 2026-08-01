// Elite Program Agreement content, approved 2026-07-27.
// Structured legal content kept as a plain module, same pattern as
// PolicyComp.tsx / MobileTermsOfService.tsx. Mirrored in
// mobile/constants/eliteAgreement.ts — keep both in sync by hand, and bump
// ELITE_AGREEMENT_VERSION in both whenever the text changes.

export const ELITE_AGREEMENT_VERSION = '2026-07-27';

type AgreementSection = {
  heading: string;
  paragraphs?: string[];
  list?: string[];
};

type AgreementContent = {
  title: string;
  subtitle: string;
  lastUpdated: string;
  preamble: string;
  sections: AgreementSection[];
  summary: string;
  checkboxLabel: string;
  readFullLinkLabel: string;
};

export const ELITE_AGREEMENT: Record<'en' | 'ar', AgreementContent> = {
  en: {
    title: 'Elite Program Agreement',
    subtitle: 'U.S. Stock Portfolio Management & Investment Recommendations',
    lastUpdated: 'Last updated: July 27, 2026',
    preamble:
      'BioPharmaStock ("the Company") has extensive experience analyzing U.S. equities, particularly biopharmaceutical stocks, and issues investment recommendations based on rigorous technical and fundamental analysis. By submitting an Elite Program application, you ("the Member") agree to the following terms governing the Company\'s provision of portfolio recommendations and the profit-sharing arrangement described below.',
    sections: [
      {
        heading: 'Article 1 — Subject of the Agreement',
        paragraphs: [
          'The Company provides the Member with direct recommendations regarding the purchase and sale of U.S. stocks. The service includes:',
        ],
        list: [
          'Analyzing and selecting suitable stocks for entry.',
          'Sending the rationale for entry and expected price movement for each trade.',
          'Setting suggested entry and exit levels.',
          "Monitoring the account's overall performance and providing recommendations as needed.",
        ],
      },
      {
        heading: 'Article 2 — Company Fees',
        list: [
          'The Company charges 15% of the net profit realized on each trade closed at a profit. The percentage is calculated on net profit after deducting any prior unrecovered losses (see Article 3).',
          'The amount owed is transferred after a profitable trade closes, through one of the following: Stripe, or direct bank transfer.',
        ],
      },
      {
        heading: 'Article 3 — Handling of Losing Trades',
        list: [
          "If any trade closes at a loss, that loss is carried forward and deducted from subsequent profits before the Company's fee percentage is calculated.",
          'Example: if the Member incurs a $1,000 loss on one trade, then a $2,000 profit on the next trade, the prior loss ($1,000) is deducted from the new profit ($2,000) first, leaving $1,000 in net shareable profit. In this case, the Company is owed 15% of $1,000 = $150.',
        ],
      },
      {
        heading: 'Article 4 — Company Obligations',
        list: [
          'Provide recommendations and analysis based on professional experience and knowledge of the U.S. market.',
          'Send details of each trade (entry rationale, expected targets, and suggested stop-loss level).',
          "Maintain the confidentiality of the Member's data and any financial information related to their investment account.",
        ],
      },
      {
        heading: 'Article 5 — Member Obligations',
        list: [
          'Execute recommendations at their own personal responsibility, after reviewing and understanding them.',
          'Transfer fees owed to the Company promptly once profits are realized, per the agreed mechanism.',
          'Notify the Company of any changes to their account, trading platform, or payment method.',
        ],
      },
      {
        heading: 'Article 6 — Confidentiality & Privacy',
        paragraphs: [
          'Both parties agree to keep all information and data related to recommendations or investment accounts confidential, and not to share it with any third party without prior written consent.',
        ],
      },
      {
        heading: 'Article 7 — Term',
        paragraphs: [
          "This agreement is effective for 12 months from the date of acceptance and automatically renews unless either party gives at least 15 days' notice, before the end of the term, of their intent to end it.",
        ],
      },
      {
        heading: 'Article 8 — Termination',
        paragraphs: ['Either party may terminate this agreement at any time, provided that:'],
        list: [
          'All outstanding financial dues are settled as of the termination date.',
          'There are no open trades whose results have not yet been finalized.',
        ],
      },
      {
        heading: 'Article 9 — Governing Law',
        paragraphs: [
          'This agreement is governed by the laws and regulations applicable in the jurisdiction in which the Company operates, unless otherwise agreed by both parties.',
        ],
      },
    ],
    summary:
      'By applying to the Elite Program, you agree that BioPharmaStock will provide investment recommendations for your U.S. stock portfolio in exchange for 15% of net realized profit per winning trade (after offsetting any prior unrecovered losses). This is not investment advice — all investment decisions and any resulting gains or losses remain your sole responsibility.',
    checkboxLabel: 'I have read, understood, and agree to the Elite Program Agreement.',
    readFullLinkLabel: 'Read Full Agreement',
  },
  ar: {
    title: 'اتفاقية برنامج النخبة',
    subtitle: 'إدارة محفظة وتوصيات استثمارية في الأسهم الأمريكية',
    lastUpdated: 'آخر تحديث: 27 يوليو 2026',
    preamble:
      'تمتلك BioPharmaStock ("الشركة") خبرة واسعة في تحليل الأسهم الأمريكية، وخصوصًا الأسهم الدوائية، وتُصدر توصيات استثمارية مبنية على تحليلات فنية وأساسية دقيقة. من خلال تقديم طلب الانضمام إلى برنامج النخبة، فإنك ("العضو") توافق على الشروط التالية التي تحكم تقديم الشركة لتوصيات إدارة المحفظة وآلية اقتسام الأرباح الموضحة أدناه.',
    sections: [
      {
        heading: 'البند الأول: موضوع الاتفاقية',
        paragraphs: ['تقدّم الشركة للعضو توصيات مباشرة بخصوص شراء وبيع الأسهم الأمريكية. وتشمل الخدمات:'],
        list: [
          'تحليل واختيار الأسهم المناسبة للدخول.',
          'إرسال سبب الدخول وتوقعات الحركة السعرية لكل صفقة.',
          'تحديد مستويات الدخول والخروج المقترحة.',
          'متابعة الأداء العام للحساب وتقديم التوصيات عند الحاجة.',
        ],
      },
      {
        heading: 'البند الثاني: أتعاب الشركة',
        list: [
          'تتقاضى الشركة 15% (خمسة عشر بالمائة) من صافي الأرباح المحققة عن كل صفقة تُغلق بالربح. تُحتسب النسبة من صافي الربح بعد خصم أي خسائر سابقة غير معوّضة (انظر البند الثالث).',
          'يتم تحويل المبلغ المستحق بعد إغلاق الصفقة الرابحة عبر أحد الخيارين التاليين: منصة Stripe، أو تحويل بنكي مباشر.',
        ],
      },
      {
        heading: 'البند الثالث: معالجة الصفقات الخاسرة',
        list: [
          'في حال إغلاق أي صفقة بخسارة، تُرحَّل هذه الخسارة وتُخصم من الأرباح اللاحقة قبل احتساب نسبة الشركة المستحقة.',
          'مثال توضيحي: إذا خسر العضو في صفقة مبلغ 1000 دولار أمريكي، ثم حقق في الصفقة التالية ربحًا قدره 2000 دولار أمريكي، يتم خصم الخسارة أولًا (1000$) من الربح الجديد (2000$)، ليصبح صافي الربح القابل للاقتسام 1000$ فقط. وفي هذه الحالة، تستحق الشركة 15% من 1000$ = 150$.',
        ],
      },
      {
        heading: 'البند الرابع: التزامات الشركة',
        list: [
          'تقديم توصيات وتحليلات مبنية على الخبرة والمعرفة المهنية بالسوق الأمريكي.',
          'إرسال تفاصيل كل صفقة (أسباب الدخول، الأهداف المتوقعة، ومستوى وقف الخسارة المقترح).',
          'الحفاظ على سرية بيانات العضو وأي معلومات مالية تتعلق بحسابه الاستثماري.',
        ],
      },
      {
        heading: 'البند الخامس: التزامات العضو',
        list: [
          'تنفيذ التوصيات على مسؤوليته الشخصية، بعد الاطلاع عليها وفهمها.',
          'تحويل الأتعاب المستحقة للشركة فور تحقق الأرباح، وفق الآلية المتفق عليها.',
          'إخطار الشركة بأي تغييرات تخص حسابه أو منصة التداول أو وسيلة الدفع.',
        ],
      },
      {
        heading: 'البند السادس: السرية والخصوصية',
        paragraphs: [
          'يتعهد الطرفان بالحفاظ على سرية جميع المعلومات والبيانات المتعلقة بالتوصيات أو الحسابات الاستثمارية، وعدم مشاركتها مع أي طرف ثالث دون موافقة خطية مسبقة.',
        ],
      },
      {
        heading: 'البند السابع: مدة الاتفاقية',
        paragraphs: [
          'تسري هذه الاتفاقية لمدة 12 شهرًا من تاريخ الموافقة عليها، وتُجدَّد تلقائيًا ما لم يُخطر أحد الطرفين الآخر برغبته في إنهائها قبل 15 يومًا على الأقل من تاريخ الانتهاء.',
        ],
      },
      {
        heading: 'البند الثامن: إنهاء الاتفاقية',
        paragraphs: ['يجوز لأي من الطرفين إنهاء الاتفاقية في أي وقت، بشرط:'],
        list: [
          'تسوية جميع المستحقات المالية حتى تاريخ الإنهاء.',
          'عدم وجود صفقات مفتوحة لم تُحسب نتائجها بعد.',
        ],
      },
      {
        heading: 'البند التاسع: القانون المعمول به',
        paragraphs: [
          'تخضع هذه الاتفاقية لأحكام القوانين والأنظمة المعمول بها في الدولة التي تعمل بها الشركة، ما لم يتفق الطرفان على خلاف ذلك.',
        ],
      },
    ],
    summary:
      'بتقديمك طلب الانضمام إلى برنامج النخبة، فإنك توافق على أن تقوم BioPharmaStock بتقديم توصيات استثمارية لمحفظتك في الأسهم الأمريكية مقابل 15% من صافي الأرباح المحققة عن كل صفقة رابحة (بعد خصم أي خسائر سابقة غير معوّضة). هذا لا يُعد استشارة استثمارية — جميع قرارات الاستثمار وأي أرباح أو خسائر ناتجة عنها هي مسؤوليتك وحدك.',
    checkboxLabel: 'لقد قرأت اتفاقية برنامج النخبة وفهمتها وأوافق عليها.',
    readFullLinkLabel: 'قراءة الاتفاقية كاملة',
  },
};
