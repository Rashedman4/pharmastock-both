import { Suspense } from "react";
import PublicElitePage from "@/components/program/PublicElitePage";

function EliteGroupFallback() {
  return <div className="min-h-screen" />;
}

export default function EliteGroupPageAr() {
  return (
    <Suspense fallback={<EliteGroupFallback />}>
      <PublicElitePage lang="ar" />
    </Suspense>
  );
}
