# Store listing copy

Copy-paste source for Google Play and the App Store, English and Arabic.
Open this file in VS Code to copy the Arabic — terminals often mangle
right-to-left text on copy.

Every block below was checked against its store's character limit, contains no
emojis, and avoids trading/signals wording, per the app's App Store conventions.

---

## Where each field goes

| Field | Google Play | App Store Connect |
|---|---|---|
| App name | Store listing -> App name (30) | App Information -> Name (30) |
| Subtitle | — | App Information -> Subtitle (30) |
| Short description | Store listing -> Short description (80) | — |
| Promotional text | — | Version page -> Promotional Text (170) |
| Description | Store listing -> Full description (4000) | Version page -> Description (4000) |
| Keywords | — | Version page -> Keywords (100) |
| What's new | Release -> Release notes (500) | Version page -> What's New (4000) |

---

## Release notes (What's new) — version 1.1.0

Shown with *this update* only. This is not the app description.
Notes for earlier versions are in this file's git history.

### What's new

Play: Production -> release -> Release notes, per language. App Store: the 1.1.0 version page -> What's New in This Version, per localization.

**English** (467 chars)

```
What's new:

• Stock search: find any company by symbol or name, and open its page for related news, daily updates and announcements
• Watchlist: follow up to 50 symbols and be notified when something new is published about them
• Company announcements: a new tab in News, in English and Arabic
• Search news by symbol
• Dark mode: follow your device, or pick light or dark in Settings > Appearance

Thanks for using Bio Pharma Stock. We'd love to hear your feedback.
```

**العربية** (447 chars)

```
الجديد في هذا الإصدار:

• البحث عن الأسهم: ابحث عن أي شركة بالرمز أو الاسم، وافتح صفحتها للأخبار والتحديثات اليومية والإعلانات المتعلقة بها
• قائمة المتابعة: تابع حتى 50 رمزاً واحصل على إشعار عند نشر أي جديد عنها
• إعلانات الشركات: تبويب جديد في صفحة الأخبار، بالعربية والإنجليزية
• البحث في الأخبار بالرمز
• الوضع الداكن: اتبع إعدادات جهازك، أو اختر الفاتح أو الداكن من الإعدادات ثم المظهر

شكراً لاستخدامك Bio Pharma Stock — نسعد بسماع ملاحظاتك.
```

---

## App description and supporting fields

### Full description

Play: Store listing -> Full description. App Store: version page -> Description.

The 1.1.0 text below adds the stock, watchlist, announcement and appearance
sections. **Google Play:** paste it now, any time. **App Store:** 1.1.0 was
submitted carrying the 1.0.1 description, which locks when the version goes
live, so this text lands with the *next* version. Promotional Text is the one
App Store field that can still be updated today.

**English** (2181 chars)

```
Bio Pharma Stock: Where Science Meets Investing.

Biotechnology and pharmaceutical companies move on science: clinical trial results, FDA decisions, and new treatments reaching patients. Bio Pharma Stock brings that research together in one place, in English and Arabic, so you can follow the developments shaping the sector.

NEWS
Stay current with the latest news on publicly traded biotechnology and pharmaceutical companies, each tagged with its ticker symbol. Search the news by symbol to see only one company.

STOCKS AND WATCHLIST
Search any company by symbol or name and open its page to find the news, daily updates and announcements that mention it. Follow up to 50 symbols in your watchlist, see them on your home screen, and be notified when something new is published about them.

COMPANY ANNOUNCEMENTS
Company announcements, in English and Arabic, in their own tab alongside the news.

SCIENCE
Explore breakthroughs in drugs, therapies, and medical devices. Each one is tracked by stage (Research, Clinical, or Approved) with a clear explanation of what it is and its potential impact. Filter by category and stage to find what matters to you.

DAILY UPDATES
Short, focused updates on individual companies. Today's updates appear first, and a day picker lets you browse previous days.

MESSAGES
Have a question? Message our team directly from the app with text, photos, or voice messages.

ALERTS
Stay informed with notifications and in-app alerts.

FULL ARABIC SUPPORT
Every screen is available in English and Arabic, with a complete right-to-left layout.

LIGHT AND DARK
The app follows your device appearance, or you can choose light or dark yourself in Settings.

ABOUT US
Our research team continuously analyzes clinical trials, FDA regulatory events, scientific publications, and corporate developments across the biotechnology and pharmaceutical sector.

DISCLAIMER
All content in Bio Pharma Stock is provided for informational and educational purposes only and does not constitute financial, investment, or medical advice. Always do your own research and consult a licensed professional before making any investment decision.

Contact: info@biopharmastock.com
```

**العربية** (1945 chars)

```
Bio Pharma Stock: حيث يلتقي العلم بالاستثمار.

تتحرك شركات التكنولوجيا الحيوية والأدوية بفعل العلم: نتائج التجارب السريرية، وقرارات إدارة الغذاء والدواء الأمريكية (FDA)، والعلاجات الجديدة التي تصل إلى المرضى. يجمع Bio Pharma Stock هذه الأبحاث في مكان واحد، باللغتين العربية والإنجليزية، لتتابع التطورات التي تصنع مستقبل هذا القطاع.

الأخبار
تابع آخر الأخبار عن شركات التكنولوجيا الحيوية والأدوية المدرجة في الأسواق، مع رمز كل شركة. ويمكنك البحث في الأخبار بالرمز لعرض أخبار شركة واحدة.

الأسهم وقائمة المتابعة
ابحث عن أي شركة بالرمز أو الاسم، وافتح صفحتها لتجد الأخبار والتحديثات اليومية والإعلانات التي تذكرها. تابع حتى 50 رمزاً في قائمة المتابعة، واعرضها في الشاشة الرئيسية، واحصل على إشعار عند نشر أي جديد عنها.

إعلانات الشركات
إعلانات الشركات بالعربية والإنجليزية، في تبويب خاص بها إلى جانب الأخبار.

العلوم
استكشف الابتكارات في الأدوية والعلاجات والأجهزة الطبية. يُتابَع كل ابتكار بحسب مرحلته (بحث، أو سريري، أو معتمد) مع شرح واضح له ولأثره المحتمل. يمكنك التصفية حسب الفئة والمرحلة للوصول إلى ما يهمك.

التحديثات اليومية
تحديثات قصيرة ومركّزة عن الشركات. تظهر تحديثات اليوم أولاً، ويمكنك تصفح الأيام السابقة عبر أداة اختيار اليوم.

الرسائل
لديك سؤال؟ راسل فريقنا مباشرة من داخل التطبيق بالنصوص أو الصور أو الرسائل الصوتية.

التنبيهات
ابقَ على اطلاع من خلال الإشعارات والتنبيهات داخل التطبيق.

دعم كامل للغة العربية
جميع الشاشات متاحة بالعربية والإنجليزية، مع تخطيط كامل من اليمين إلى اليسار.

الوضع الفاتح والداكن
يتبع التطبيق مظهر جهازك، أو يمكنك اختيار الفاتح أو الداكن بنفسك من الإعدادات.

من نحن
يحلل فريق الأبحاث لدينا باستمرار التجارب السريرية، والقرارات التنظيمية لإدارة الغذاء والدواء الأمريكية (FDA)، والأبحاث العلمية المنشورة، والمستجدات المؤسسية في قطاع التكنولوجيا الحيوية والأدوية.

إخلاء مسؤولية
جميع المحتويات في Bio Pharma Stock مقدّمة لأغراض إعلامية وتثقيفية فقط، ولا تُعد نصيحة مالية أو استثمارية أو طبية. احرص دائماً على إجراء بحثك الخاص واستشارة مختص مرخّص قبل اتخاذ أي قرار استثماري.

للتواصل: info@biopharmastock.com
```

### Short description (Google Play only)

Play: Store listing -> Short description.

**English** (76 chars)

```
Biotech and pharma news, breakthroughs, daily updates, and a stock watchlist
```

**العربية** (73 chars)

```
أخبار وابتكارات وتحديثات يومية ومتابعة لأسهم التكنولوجيا الحيوية والأدوية
```

### Subtitle (App Store only)

App Store: App Information -> Subtitle. Same wording as the in-app tagline.

**English** (29 chars)

```
Where Science Meets Investing
```

**العربية** (26 chars)

```
حيث يلتقي العلم بالاستثمار
```

### Promotional text (App Store only)

App Store: version page -> Promotional Text. The only App Store text that can be changed at any time without submitting a new version.

**English** (156 chars)

```
Follow the research, the trials, and the breakthroughs shaping tomorrow's markets. Now with stock search, a watchlist, company announcements, and dark mode.
```

**العربية** (136 chars)

```
تابع الأبحاث والتجارب السريرية والابتكارات التي تصنع أسواق الغد، الآن مع البحث عن الأسهم وقائمة المتابعة وإعلانات الشركات والوضع الداكن.
```

### Keywords (App Store only)

App Store: version page -> Keywords. Comma-separated, no space after commas. Never shown to users.

`healthcare` was dropped in favour of `watchlist` to stay inside 100 — the term
is far too broad to rank on, and the watchlist is the headline 1.1.0 feature.

**English** (92 chars)

```
biotech,pharma,FDA,clinical trials,biotechnology,drug,therapy,watchlist,research,stocks,news
```

**العربية** (76 chars)

```
تكنولوجيا حيوية,أدوية,FDA,تجارب سريرية,أبحاث,أخبار,علاجات,أسهم,متابعة الأسهم
```
