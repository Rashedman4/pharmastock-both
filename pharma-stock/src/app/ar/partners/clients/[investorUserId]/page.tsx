import PartnerClientDetailPage from "@/components/program/PartnerClientDetailPage";

export default async function PartnerClientDetailAr({
  params,
}: {
  params: Promise<{ investorUserId: string }>;
}) {
  const { investorUserId } = await params;
  return (
    <PartnerClientDetailPage
      investorUserId={Number(investorUserId)}
      lang="ar"
    />
  );
}
