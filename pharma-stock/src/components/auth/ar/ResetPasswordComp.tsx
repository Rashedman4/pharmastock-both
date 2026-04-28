"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const errTranslate: { [key: string]: string } = {
  "An error occurred": "حدث خطأ.",
  "Invalid or expired token": "رمز غير صالح أو منتهي الصلاحية.",
};

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const token = searchParams?.get("token");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/ar/auth/login"), 3000);
      } else {
        const data = await res.json();
        setError(data.message || "حدث خطأ ما. يرجى المحاولة مرة أخرى");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setError("حدث خطأ ما. يرجى المحاولة مرة أخرى.");
    }
  };

  return (
    <>
      <Card className="max-w-md mx-auto mt-10 " dir="rtl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-royalBlue">
            إعادة تعيين كلمة المرور
          </CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <p className="text-center text-green-500 mt-4">
              تمت إعادة تعيين كلمة المرور بنجاح! جارٍ إعادة التوجيه...
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  كلمة المرور الجديدة
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="أدخل كلمة المرور الجديدة"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  تأكيد كلمة المرور
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="تأكيد كلمة المرور الجديدة"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-red-500">
                  {" "}
                  {error in errTranslate ? errTranslate[error] : error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-brightTeal hover:bg-brightTeal/90 text-pureWhite"
              >
                إعادة تعيين كلمة المرور
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default function ResetPasswordComp() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
