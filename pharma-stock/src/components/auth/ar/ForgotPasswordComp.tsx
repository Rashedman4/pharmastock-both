"use client";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

const errTranslate: { [key: string]: string } = {
  "Something went wrong": "حدث خطأ ما.",
  "Email not found": "البريد الإلكتروني غير موجود.",
};

export default function ForgotPasswordComp() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, lang: "ar" }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(
          "تم إرسال بريد إلكتروني لإعادة تعيين كلمة المرور. يرجى التحقق من صندوق الوارد الخاص بك."
        );
      } else {
        setError(data.message || "حدث خطأ.");
      }
    } catch (error) {
      setError(
        "فشل إرسال بريد إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى لاحقًا."
      );
      console.log(error);
    }
  };
  return (
    <>
      <Card className="max-w-md mx-auto mt-10 " dir="rtl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-royalBlue">
            نسيت كلمة المرور
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="email"
              >
                البريد الإلكتروني
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-brightTeal hover:bg-brightTeal/90 text-pureWhite font-bold"
            >
              إعادة تعيين كلمة المرور
            </Button>
          </form>
          {message && <p className="mt-4 text-green-600">{message}</p>}
          {error && (
            <p className="mt-4 text-red-600">
              {" "}
              {error in errTranslate ? errTranslate[error] : error}
            </p>
          )}
          <p className="mt-4 text-center text-sm text-gray-500">
            هل تتذكر كلمة المرور الخاصة بك؟{" "}
            <Link
              href="/ar/auth/login"
              className="text-brightTeal hover:text-brightTeal/90"
            >
              تسجيل الدخول هنا
            </Link>
          </p>
        </CardContent>
      </Card>
    </>
  );
}
