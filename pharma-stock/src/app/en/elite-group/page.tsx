import { Suspense } from "react";
import PublicElitePage from "@/components/program/PublicElitePage";

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
