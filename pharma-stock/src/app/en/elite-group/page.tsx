import { Suspense } from "react";
import PublicElitePage from "@/components/program/PublicElitePage";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "Elite Investors Group | Bio Pharma Stock",
  description:
    "Elite Investors Group is our managed-portfolio investment program for larger investors, combining hands-on trade planning with our biopharma research intelligence.",
  alternates: buildAlternates("/elite-group", "en"),
};

function EliteGroupFallback() {
  return <div className="min-h-screen" />;
}

export default function EliteGroupPageEn() {
  return (
    <Suspense fallback={<EliteGroupFallback />}>
      <PublicElitePage lang="en" />
    </Suspense>
  );
}
