"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Error() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  return (
    <div dir="rtl">
      <h1 text-royalBlue>حدث خطأ</h1>
      {error && <p>{error}</p>}
      <a href="ar/auth/login">العودة إلى تسجيل الدخول</a>
    </div>
  );
}
export default function ErrorComp() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Error />
    </Suspense>
  );
}
