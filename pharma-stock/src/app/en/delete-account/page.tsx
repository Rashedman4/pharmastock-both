import MobileDeleteAccount from "@/components/app/MobileDeleteAccount";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "Delete Your Account | Bio Pharma Stock",
  description:
    "How to permanently delete your Bio Pharma Stock account and what data is deleted or retained.",
  alternates: buildAlternates("/delete-account", "en"),
};

export default function DeleteAccountPage() {
  return <MobileDeleteAccount lang="en" />;
}
