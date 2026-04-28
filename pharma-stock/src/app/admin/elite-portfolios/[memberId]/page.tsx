import AdminInvestorDetailPage from "@/components/program/AdminInvestorDetailPage";

export default async function AdminInvestorDetailRoute({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  return <AdminInvestorDetailPage memberId={Number(memberId)} />;
}
