"use client";
import { usePathname } from "next/navigation";
import React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  const pathname = usePathname();
  let langPrefix = pathname ? pathname.split("/")[1] : "en";
  if (langPrefix !== "ar") {
    if (langPrefix !== "en") {
      langPrefix = "en";
    }
  }
  return (
    <>
      {langPrefix === "ar" ? (
        <div
          className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
          dir="rtl"
        >
          <Search className="w-16 h-16 text-brightTeal mb-4" />
          <h1 className="text-4xl font-bold text-royalBlue mb-2">
            404 - الصفحة غير موجودة
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            عذرًا! الصفحة التي تبحث عنها غير موجودة.
          </p>
          <p className="text-lg text-gray-600 mb-8">
            قد تكون قد نُقلت أو حُذفت، أو ربما أدخلت رابطًا غير صحيح.
          </p>
          <div className="space-x-4">
            <Button asChild>
              <Link href="/ar/">العودة إلى الصفحة الرئيسية</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <Search className="w-16 h-16 text-brightTeal mb-4" />
          <h1 className="text-4xl font-bold text-royalBlue mb-2">
            404 - Page Not Found
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Oops! The page you&apos;re looking for doesn&apos;t exist.
          </p>
          <p className="text-lg text-gray-600 mb-8">
            It might have been moved or deleted, or you may have mistyped the
            URL.
          </p>
          <div className="space-x-4">
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
