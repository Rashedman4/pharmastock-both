import WhatsAppButton from "@/components/app/WhatsAppButton";

export default function englishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
      <WhatsAppButton lang="en" />
    </div>
  );
}
