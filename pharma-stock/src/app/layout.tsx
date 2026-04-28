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
//import WhatsAppButton from "@/components/app/WhatsAppButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL("https://biopharmastock.com"),
  title: "Bio Pharma Stock | Pharma Market Signals, News & Investment Insights",
  description:
    "Stay ahead in the pharmaceutical stock market with real-time signals, biotech stock news, expert analysis, and daily investment insights. Get the latest trends, forecasts, and trading strategies.",
  keywords: [
    "pharma stocks",
    "biotech stocks",
    "pharmaceutical stock signals",
    "stock market analysis",
    "trading signals",
    "pharmaceutical industry",
    "biotech investment",
    "biotech trends",
    "pharma investment",
    "stock news",
    "daily stock updates",
    "biotech stock predictions",
    "pharma stock forecast",
    "US stock market",
    "stock trading insights",
    "pharmaceutical market trends",
    "biotech companies",
    "healthcare stocks",
    "stock market research",
    "biotech IPOs",
    "pharma ETFs",
    "best biotech stocks",
    "top pharmaceutical stocks",
    "biotech penny stocks",
    "pharma industry updates",
    "stock price analysis",
    "investing in biotech",
    "pharmaceutical sector investments",
    "biotech stock ratings",
    "pharmaceutical business news",
    "long-term biotech investments",
    "healthcare sector stocks",
    "pharma stock market insights",
    "biotech stock buy signals",
    "big pharma stock updates",
    "latest pharma stock reports",
    "pharma stock alerts",
    "market trends in biotechnology",
    "pharma sector financial news",
    "AI stock predictions for biotech",
    "biotech mergers and acquisitions",
    "biotech company earnings reports",
    "pharma trading strategies",
    "pharma stock technical analysis",
    "pharma stock portfolio strategies",
    "FDA approvals and stock impact",
    "pharma regulatory news",
    "latest drug developments",
    "pharmaceutical companies in NASDAQ",
    "top biotech stocks to watch",
    "stock market for healthcare companies",
  ],
  openGraph: {
    title: "Bio Pharma Stock | Pharma Market Signals & News",
    description:
      "Stay ahead in the pharma stock market with real-time signals, daily news, and expert analysis. Subscribe for in-depth insights.",
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
    title: "Bio Pharma Stock | Pharma Market Insights",
    description:
      "Real-time stock signals, news, and updates on the US pharmaceutical sector. Get daily insights and video reports.",
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
    icon: ["/app/favicon.ico", "/app/favicon.svg"],
    apple: "/app/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Extract language from pathname
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const lang = pathname.startsWith("/ar") ? "ar" : "en";

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
        <Footer />
      </body>
    </html>
  );
}
