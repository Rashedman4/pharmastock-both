import { redirect } from 'next/navigation';

export default async function AdminAgentDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/partners/${id}`);
}
