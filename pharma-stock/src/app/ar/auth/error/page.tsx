import { Metadata } from "next";
import ErrorComp from "@/components/auth/ar/errorComp";

export const metadata: Metadata = {
  title: "حدث خطأ ما | Bio Pharma Stock",
};

export default function LoginPage() {
  return <ErrorComp />;
}
