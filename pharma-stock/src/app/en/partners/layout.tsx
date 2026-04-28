import type { ReactNode } from "react";
import { ProgramSectionNav } from "@/components/program/shared";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-6">
      <ProgramSectionNav section="partner" lang="en" />
      {children}
    </div>
  );
}
