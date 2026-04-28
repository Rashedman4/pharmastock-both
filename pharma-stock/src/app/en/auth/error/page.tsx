import { Metadata } from "next";
import ErrorComp from "@/components/auth/en/errorComp";

export const metadata: Metadata = {
  title: "Error | Bio Pharma Stock",
};

export default function LoginPage() {
  return <ErrorComp />;
}
