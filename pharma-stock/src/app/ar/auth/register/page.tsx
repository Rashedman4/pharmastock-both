import RegisterComp from "@/components/auth/ar/RegisterComp";
export const metadata = {
  title: "انشاء حساب جديد | Bio Pharma Stock",
};

export default function RegisterPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <RegisterComp />
    </div>
  );
}
