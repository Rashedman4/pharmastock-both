import VerificationComp from "@/components/auth/ar/VerificationComp";
export const metadata = {
  title: "تتحقق من بريدك الالكتروني | Bio Pharma Stock",
};
export default function VerificationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <VerificationComp />
    </div>
  );
}
