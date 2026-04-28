import LoginComp from "@/components/auth/en/LoginComp";
export const metadata = {
  title: "Login | Bio Pharma Stock",
};
export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <LoginComp />
    </div>
  );
}
