import ForgotPasswordComp from "@/components/auth/ar/ForgotPasswordComp";
export const metadata = {
  title: "نسيت كلمة المرور | Bio Pharma Stock",
};
export default function ForgotPasswordPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ForgotPasswordComp />
    </div>
  );
}
