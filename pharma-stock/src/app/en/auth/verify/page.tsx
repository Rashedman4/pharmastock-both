import VerificationComp from "@/components/auth/en/VerificationComp";
export const metadata = {
  title: "Verification | Bio Pharma Stock",
  robots: { index: false, follow: true },
};
export default function VerificationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <VerificationComp />
    </div>
  );
}
