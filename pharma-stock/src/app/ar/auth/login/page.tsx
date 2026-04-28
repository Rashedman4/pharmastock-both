import LoginComp from "@/components/auth/ar/LoginComp";
export const metadata = {
  title: "تسجيل الدخول | Bio Pharma Stock",
};
export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <LoginComp />
    </div>
  );
}
