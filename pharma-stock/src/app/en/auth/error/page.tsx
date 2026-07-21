import { Metadata } from "next";
import ErrorComp from "@/components/auth/en/errorComp";

export const metadata: Metadata = {
  title: "Error | Bio Pharma Stock",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return <ErrorComp />;
}
