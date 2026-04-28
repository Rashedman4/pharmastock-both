"use client";

import type React from "react";
import { useState, Suspense, useEffect } from "react";
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

function VerificationForm() {
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      setError("Please enter a 6-letter verification code.");
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
        router.push("/en/auth/login");
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error("Error verifying the code:", error);
      setError("Error verifying the code.");
    }
  };

  const [resendTimer, setResendTimer] = useState(0);

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
        setResendTimer(60);
      } else {
        setError(data.error || "Error resending the verification code.");
      }
    } catch (error) {
      console.log("An error occurred. Please try again.", error);
    }
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const intervalId = setInterval(() => {
        setResendTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [resendTimer]);

  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-royalBlue">
          Verify Your Email
        </CardTitle>
        <CardDescription className="text-center">
          We have sent a 6-letter verification code to your {email}.<br />
          Please enter it below. <br />
          <span className="text-sm text-gray-500">
            (Check your spam or junk folder if you don’t see the email.)
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
              Verification Code
            </label>
            <Input
              id="verificationCode"
              name="verificationCode"
              type="text"
              placeholder="Enter 6-letter code"
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
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            className="w-full bg-brightTeal hover:bg-brightTeal/90 text-pureWhite font-bold"
          >
            Verify
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          Did not receive the code?{" "}
          <button
            className={`text-brightTeal hover:text-brightTeal/90 ${
              resendTimer > 0 ? "cursor-not-allowed opacity-50" : ""
            }`}
            onClick={handleResend}
            disabled={resendTimer > 0}
          >
            {resendTimer > 0
              ? `Resend (${resendTimer} seconds)`
              : "Resend Verification Code"}
          </button>
          {error && <p className="text-red-500">{error}</p>}
        </p>
      </CardContent>
    </Card>
  );
}

export default function VerificationComp() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerificationForm />
    </Suspense>
  );
}
