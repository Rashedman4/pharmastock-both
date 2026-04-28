"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaGoogle } from "react-icons/fa";
const errTranslate: { [key: string]: string } = {
  "Invalid password": "كلمة مرور غير صحيحة",
  "No user found with this email":
    "لم يتم العثور على مستخدم بهذا البريد الإلكتروني",
};
export default function LoginComp() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // This effect runs only once when the component mounts
    const searchParams = new URLSearchParams(window.location.search);
    const msg = searchParams.get("message");
    const errorParam = searchParams.get("error");

    if (msg) {
      setError(decodeURIComponent(msg));
    } else if (errorParam) {
      setError("حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.");
    }

    // Clear the URL parameters
    if (msg || errorParam) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null); // Reset the error before making the request.

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError(result.error); // Display error if authentication fails.
    } else if (result?.ok) {
      // Redirect to the home page after successful login.
      setSuccess(true);
      router.push("/ar");

      window.location.reload(); // Forces a full page reload
    }
  };

  return (
    <>
      {error && error === "يرجى تسجيل الدخول للوصول إلى هذه الصفحة." && (
        <div
          className="w-full max-w-md mx-auto mb-4 p-4 rounded-md bg-lightGray border border-royalBlue/20"
          dir="rtl"
        >
          <p className="text-royalBlue text-sm font-medium">
            يرجى تسجيل الدخول للوصول لهذه الصفحة
          </p>
        </div>
      )}
      <Card className="max-w-md mx-auto mt-10" dir="rtl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-royalBlue">
            تسجيل الدخول
          </CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <p className="text-center text-green-500 mt-4">
              تم تسجيل الدخول بنجاح! جارٍ إعادة التوجيه...
            </p>
          ) : (
            <>
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-6">
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    htmlFor="password"
                  >
                    كلمة المرور
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error &&
                  error !== "يرجى تسجيل الدخول للوصول إلى هذه الصفحة." && (
                    <p className="text-red-500 text-sm mb-4">
                      {errTranslate[error] || "حدث خطأ ما"}
                    </p>
                  )}

                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <Button
                    type="submit"
                    className="w-full sm:w-auto mb-4 sm:mb-0 bg-brightTeal hover:bg-brightTeal/90 text-pureWhite font-bold"
                  >
                    تسجيل الدخول
                  </Button>
                  <Link
                    href="/ar/auth/forgot-password"
                    className="text-sm text-brightTeal hover:text-brightTeal/90 font-bold"
                  >
                    هل نسيت كلمة المرور؟
                  </Link>
                </div>
              </form>
              <div className="flex flex-col space-y-4 mt-4">
                <Button
                  className="flex items-center justify-center w-full bg-royalBlue hover:bg-royalBlue/90 text-pureWhite font-bold py-2"
                  onClick={() => signIn("google")}
                >
                  تسجيل الدخول باستخدام جوجل
                  <FaGoogle className="mr-2" />
                </Button>
              </div>
              <p className="mt-4 text-center text-xs text-gray-500">
                ليس لديك حساب؟{" "}
                <Link
                  href="/ar/auth/register"
                  className="text-brightTeal hover:text-brightTeal/90"
                >
                  سجل هنا
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
