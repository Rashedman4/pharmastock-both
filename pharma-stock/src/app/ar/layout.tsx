import React from "react";
import { Rubik } from "next/font/google";
import WhatsAppButton from "@/components/app/WhatsAppButton";
import HtmlLangSync from "@/components/app/HtmlLangSync";

// Import Rubik with Arabic subset
const rubik = Rubik({
  weight: ["400"], // Define font weights
  subsets: ["arabic"], // Include Arabic subset
});
export const metadata = {
  title:
    "Bio Pharma Stock | رؤى بحثية لقطاع الأدوية الحيوية — إشارات وأخبار وتحليلات استثمارية",
  description:
    "BioPharmaStock شركة متخصصة تقدّم رؤى بحثية لقطاع الأدوية الحيوية. نحلل التجارب السريرية، والقرارات التنظيمية لإدارة الغذاء والدواء الأمريكية (FDA)، ومحفزات السوق لنقدم إشارات تداول فورية، وأخبار أسهم التكنولوجيا الحيوية، وتحليلات الخبراء، ورؤى استثمارية يومية.",
  openGraph: {
    title: "Bio Pharma Stock | رؤى بحثية لقطاع الأدوية الحيوية",
    description:
      "رؤى بحثية متخصصة لقطاع الأدوية الحيوية — إشارات فورية، وأخبار يومية، وتحليلات الخبراء للمستثمرين في قطاعي الأدوية والتكنولوجيا الحيوية. اشترك للحصول على تحليلات معمّقة.",
    url: "https://biopharmastock.com/ar",
    siteName: "Bio Pharma Stock",
    images: [
      {
        url: "https://biopharmastock.com/opengraph-image.png", // Absolute URL
        width: 1200,
        height: 630,
        alt: "Bio Pharma Stock Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bio Pharma Stock | رؤى بحثية لقطاع الأدوية الحيوية",
    description:
      "رؤى بحثية متخصصة لقطاع الأدوية الحيوية، وإشارات تداول فورية، وتحديثات يومية حول قطاع الأدوية الأمريكي.",
    images: [
      {
        url: "https://biopharmastock.com/twitter-image.png", // Absolute URL
        width: 1200,
        height: 600,
        alt: "Bio Pharma Stock Logo",
      },
    ],
  },
  icons: {
    icon: "/app/favicon.ico",
    apple: "/app/apple-icon.png",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div dir="rtl" className={`${rubik.className} m-0 p-0 rtl`}>
      <HtmlLangSync lang="ar" />
      {children}
      <WhatsAppButton lang="ar" />
    </div>
  );
}
