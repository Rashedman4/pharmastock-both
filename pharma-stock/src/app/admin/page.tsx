import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroPanel, SectionCard } from "@/components/program/shared";

export default function AdminHome() {
  return (
    <div className="space-y-8">
      <HeroPanel
        badge="Admin"
        title="Simplified partner and investor management."
        description="The rebuilt flow is centered around partner approval, investor approval, trade plans, execution notes, and close request handling. The dead affiliate clutter is out."
        actions={
          <>
            <Button asChild><Link href="/admin/partners">Open partners</Link></Button>
            <Button asChild variant="outline"><Link href="/admin/elite-portfolios">Open investor management</Link></Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Partners" description="Approve partners, inspect phone number and bio, and confirm their linked investors.">
          <Link href="/admin/partners" className="text-sm font-semibold text-blue-700">Go to partners →</Link>
        </SectionCard>
        <SectionCard title="Investor applications" description="Approve or reject Elite applicants and see whether a partner is attached.">
          <Link href="/admin/elite-applications" className="text-sm font-semibold text-blue-700">Go to investor applications →</Link>
        </SectionCard>
        <SectionCard title="Investor management" description="Create plans, exchange notes, and manage close requests per investor.">
          <Link href="/admin/elite-portfolios" className="text-sm font-semibold text-blue-700">Go to investor management →</Link>
        </SectionCard>
      </div>
    </div>
  );
}
