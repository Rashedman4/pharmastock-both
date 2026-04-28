import { redirect } from 'next/navigation';

export default async function DeprecatedAssignExecutionPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  redirect(`/admin/elite-portfolios/${memberId}`);
}
