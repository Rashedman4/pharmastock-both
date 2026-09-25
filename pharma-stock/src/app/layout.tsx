import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/app/Navbar";
import Footer from "@/components/app/Footer";
import type React from "react";
import SessionWrapper from "@/components/sessionWrapper";
import { Toaster } from "@/components/ui/toaster";
import PolicyModal from "@/components/app/PolicyModal";
import AuthModal from "@/components/app/AuthModal";
import Script from "next/script";
import PageTracker from "@/components/app/PageTracker";
import AppPromoBanner from "@/components/app/AppPromoBanner";
//import WhatsAppButton from "@/components/app/WhatsAppButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL("https://biopharmastock.com"),
  title:
    "Bio Pharma Stock | Biopharma Research Intelligence — Signals, News & Insights",
  description:
    "BioPharmaStock is a specialized biopharma research intelligence company. We analyze clinical trials, FDA regulatory events, and market catalysts to deliver real-time trading signals, biotech stock news, expert analysis, and daily investment insights.",
  openGraph: {
    title: "Bio Pharma Stock | Biopharma Research Intelligence",
    description:
      "Specialized biopharma research intelligence — real-time signals, daily news, and expert analysis for pharmaceutical and biotech investors. Subscribe for in-depth insights.",
    url: "https://biopharmastock.com",
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
    title: "Bio Pharma Stock | Biopharma Research Intelligence",
    description:
      "Specialized biopharma research intelligence, real-time trading signals, and daily insights on the US pharmaceutical sector.",
    images: [
      {
        url: "https://biopharmastock.com/twitter-image.png", // Absolute URL
        width: 1200,
        height: 600,
        alt: "Bio Pharma Stock Logo",
      },
    ],
  },
  alternates: {
    canonical: "https://biopharmastock.com/en",
    languages: {
      en: "https://biopharmastock.com/en",
      ar: "https://biopharmastock.com/ar",
      "x-default": "https://biopharmastock.com/en",
    },
  },
  icons: {
    icon: ["/app/favicon.ico", "/app/favicon.svg"],
    apple: "/app/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Static default — the /en and /ar segment layouts correct the actual
  // lang/dir via HtmlLangSync once mounted. Reading the real pathname here
  // would require headers()/dynamic rendering for every route in the app.
  const lang = "en";

  return (
    <html lang={lang} className="light">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Bio Pharma Stock",
              description:
                "BioPharmaStock is a specialized biopharmaceutical investment intelligence company focused exclusively on publicly traded biotechnology and pharmaceutical companies. Our research team continuously analyzes clinical trials, FDA regulatory events, scientific publications, corporate developments, and market catalysts to deliver timely research and exclusive insights for investors seeking opportunities in one of the world's most knowledge-intensive sectors.",
              url: "https://biopharmastock.com",
              logo: "https://biopharmastock.com/web-app-manifest-192x192.png",
              /* sameAs: [
                "https://twitter.com/yourhandle", // Optional: Twitter
                "https://www.linkedin.com/company/yourcompany", // Optional: LinkedIn
                "https://www.facebook.com/yourpage", // Optional: Facebook
              ], */
              /* contactPoint: {
                "@type": "ContactPoint",
                telephone: "+1-800-123-4567", // Optional: real or placeholder
                contactType: "Customer Support",
                areaServed: "US",
                availableLanguage: ["English", "Arabic"],
              }, */
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Bio Pharma Stock",
              url: "https://biopharmastock.com",
              inLanguage: ["en", "ar"],
              // No `potentialAction`/SearchAction: the only candidate target
              // (/en/ask-about-stock) is auth-gated and 307s to a `noindex`
              // login page, so declaring it advertised a search entry point
              // that no crawler or user could actually reach. Re-add this once
              // a genuinely public search page exists.
            }),
          }}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/app/favicon-16x16.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/app/favicon-32x32.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/app/apple-icon.png"
        />
        <link rel="icon" type="image/svg+xml" href="/app/favicon.svg" />
      </head>
      <body
        className={`${inter.className} dark:bg-gray-900 dark:text-white flex flex-col min-h-screen`}
      >
        {/* Twitter Pixel Script */}
        <Script id="twitter-pixel" strategy="afterInteractive">
          {`!function(e,t,n,s,u,a){
              e.twq||(s=e.twq=function(){
                  s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
              },
              s.version='1.1',
              s.queue=[],
              u=t.createElement(n),
              u.async=!0,
              u.src='https://static.ads-twitter.com/uwt.js',
              a=t.getElementsByTagName(n)[0],
              a.parentNode.insertBefore(u,a))
          }(window,document,'script');
          twq('config','pshk2');`}
        </Script>
        <SessionWrapper>
          <Navbar />
        </SessionWrapper>
        <PageTracker />
        <main className="flex-grow">
          {" "}
          <SessionWrapper>{children}</SessionWrapper>
        </main>
        <Toaster />
        <PolicyModal />
        <SessionWrapper>
          <AuthModal />
        </SessionWrapper>
        <SessionWrapper>
          <Footer />
        </SessionWrapper>
        <AppPromoBanner />
      </body>
    </html>
  );
}
