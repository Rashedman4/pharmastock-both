import AdminPartnerDetailPage from "@/components/program/AdminPartnerDetailPage";

export default async function AdminPartnerDetailRoute({ params }: { params: Promise<{ partnerId: string }> }) {
  const { partnerId } = await params;
  return <AdminPartnerDetailPage partnerId={Number(partnerId)} />;
}
