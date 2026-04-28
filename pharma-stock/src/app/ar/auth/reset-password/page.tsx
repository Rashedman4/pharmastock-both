import ResetPasswordComp from "@/components/auth/ar/ResetPasswordComp";
export const metadata = {
  title: "اعادة نغيين كلمة المرور | Bio Pharma Stock",
};
export default function RegisterPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ResetPasswordComp />
    </div>
  );
}
