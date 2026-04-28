"use client";
import React, { useState, Suspense, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter, useSearchParams } from "next/navigation";

const errTranslate: { [key: string]: string } = {
  "Invalid verification code or email.":
    "رمز التحقق أو البريد الإلكتروني غير صالح.",
  "Error completing the registration process. Please try again later.":
    "حدث خطأ أثناء إتمام عملية التسجيل. يرجى المحاولة مرة أخرى لاحقاً.",
  "Verification successful and registration completed.":
    "تم التحقق بنجاح واكتمال التسجيل.",
};

function VerificationForm() {
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      setError("يرجى إدخال رمز التحقق المكون من 6 أحرف.");
      return;
    }

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();
      if (response.ok) {
        // Redirect after successful verification
        router.push("/ar/auth/login");
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error("Error verifying the code:", error);
      setError("خطأ في التحقق من الرمز.");
    }
  };

  const [resendTimer, setResendTimer] = useState(0); // Timer in seconds

  const handleResend = async () => {
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setResendTimer(60); // Set the timer for 1 minute (60 seconds)
      } else {
        setError(data.error || ".حدث خطأ في اعادة ارسال الرمز");
      }
    } catch (error) {
      console.log("An error occurred. Please try again.", error);
    }
  };

  // Decrease the resend timer every second
  useEffect(() => {
    if (resendTimer > 0) {
      const intervalId = setInterval(() => {
        setResendTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(intervalId); // Clear interval when component unmounts or timer changes
    }
  }, [resendTimer]);

  return (
    <Card className="max-w-md mx-auto mt-10 " dir="rtl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-royalBlue">
          تحقق من بريدك الإلكتروني
        </CardTitle>
        <CardDescription className="text-center">
          لقد أرسلنا رمز تحقق مكون من 6 أحرف إلى {email}.<br />
          يرجى إدخاله أدناه.
          <br />
          <span className="text-sm text-gray-500">
            (يرجى التحقق من مجلد الرسائل غير المرغوب فيها (spam) في حال لم تصلك
            الرسالة.)
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block text-sm font-medium text-gray-700 mb-2"
              htmlFor="verificationCode"
            >
              رمز التحقق
            </label>
            <Input
              id="verificationCode"
              name="verificationCode"
              type="text"
              placeholder="أدخل رمز مكون من 6 أحرف"
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(e.target.value.toUpperCase())
              }
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              required
            />
          </div>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {error in errTranslate ? errTranslate[error] : error}
              </AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            className="w-full bg-brightTeal hover:bg-brightTeal/90 text-pureWhite font-bold"
          >
            تحقق
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          لم تتلقَ الرمز؟{" "}
          <button
            className={`text-brightTeal hover:text-brightTeal/90 ${
              resendTimer > 0 ? "cursor-not-allowed opacity-50" : ""
            }`}
            onClick={handleResend}
            disabled={resendTimer > 0}
          >
            {resendTimer > 0
              ? `اعادة ارسال في (${resendTimer} ثانية)`
              : "اعادة ارسال رمز التحقق"}
          </button>
          {error && <p className="text-red-500">{error}</p>}
        </p>
      </CardContent>
    </Card>
  );
}

export default function VerificationComp() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <VerificationForm />
      </Suspense>
    </>
  );
}
