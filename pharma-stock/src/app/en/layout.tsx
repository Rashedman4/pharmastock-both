import WhatsAppButton from "@/components/app/WhatsAppButton";
import HtmlLangSync from "@/components/app/HtmlLangSync";

export default function englishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <HtmlLangSync lang="en" />
      {children}
      <WhatsAppButton lang="en" />
    </div>
  );
}
