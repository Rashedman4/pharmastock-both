import MobileDeleteAccount from "@/components/app/MobileDeleteAccount";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "حذف الحساب | Bio Pharma Stock",
  description:
    "كيفية حذف حسابك في Bio Pharma Stock بشكل نهائي وما هي البيانات التي يتم حذفها أو الاحتفاظ بها.",
  alternates: buildAlternates("/delete-account", "ar"),
};

export default function DeleteAccountPage() {
  return <MobileDeleteAccount lang="ar" />;
}
