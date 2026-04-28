"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";

const translations = {
  en: {
    title: "Payment Successful!",
    subscriptionDetails: "Subscription Details",
    amount: "Amount Paid",
    validUntil: "Valid Until",
    whatsappTitle: "Get Signals on WhatsApp",
    whatsappInstructions: "To receive signals on WhatsApp:",
    step1: "1. Save this number:",
    step2: "2. Send your unique code to the number",
    phoneLabel: "Your WhatsApp number",
    submitButton: "Generate Code",
    codeCopied: "Code copied!",
    phoneSubmitted: "Phone number submitted successfully!",
  },
  ar: {
    title: "!تمت عملية الدفع بنجاح",
    subscriptionDetails: "تفاصيل الاشتراك",
    amount: "المبلغ المدفوع",
    validUntil: "صالح حتى",
    whatsappTitle: "احصل على الإشارات عبر واتساب",
    whatsappInstructions: ":لتلقي الإشارات على واتساب",
    step1: ":1. احفظ هذا الرقم",
    step2: "2. أرسل رمزك الفريد إلى الرقم",
    phoneLabel: "رقم الواتساب الخاص بك",
    submitButton: "توليد الرمز",
    codeCopied: "!تم نسخ الرمز",
    phoneSubmitted: "!تم إرسال رقم الهاتف بنجاح",
  },
};
interface LangProps {
  lang: "en" | "ar";
}
export default function SuccessComp({ lang }: LangProps) {
  const t = translations[lang];
  // const [amount, setAmount] = useState<string>("");
  const [latestTransactionAmount, setLatestTransactionAmount] =
    useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const whatsappNumber = "+9627878777";

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const subscriptionId = searchParams.get("subscription_id");
    const amountParam = searchParams.get("amount");

    if (subscriptionId) {
      // If we have a subscription ID, fetch the subscription details using POST
      fetch(`/api/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.amount) {
            //         setAmount((data.amount / 100).toFixed(2)); // Convert cents to dollars
          }
          if (data.latestTransactionAmount) {
            setLatestTransactionAmount(
              (data.latestTransactionAmount / 100).toFixed(2)
            ); // Convert cents to dollars
          }
        })
        .catch((error) => {
          console.error("Error fetching subscription details:", error);
        });
    } else if (amountParam) {
      // If we have an amount parameter, use it directly
      // setAmount(amountParam);
    }
  }, []);

  const handleSubmitPhone = async () => {
    try {
      const response = await fetch("/api/whatsapp-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await response.json();
      setPinCode(data.pinCode);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-royalBlue to-brightTeal py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">{t.title}</h1>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">
                {t.subscriptionDetails}
              </h2>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">{t.amount}:</span>
                  {latestTransactionAmount ? (
                    `$${latestTransactionAmount}`
                  ) : (
                    <span className="text-gray-400 animate-pulse">
                      Loading...
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">{t.whatsappTitle}</h2>
              <div className="space-y-4">
                <p>{t.whatsappInstructions}</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>{t.step1}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="bg-gray-100 px-3 py-1 rounded">
                      {whatsappNumber}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(whatsappNumber)}
                    >
                      {copied ? t.codeCopied : "Copy"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t.phoneLabel}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1234567890"
                      />
                      <Button onClick={handleSubmitPhone}>
                        {t.submitButton}
                      </Button>
                    </div>
                  </div>

                  {pinCode && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p>{t.step2}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="bg-gray-100 px-3 py-1 rounded">
                          {pinCode}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(pinCode)}
                        >
                          {copied ? t.codeCopied : "Copy"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
