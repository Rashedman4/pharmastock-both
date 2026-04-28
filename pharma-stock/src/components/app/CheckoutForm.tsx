"use client";

import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CheckoutFormProps {
  clientSecret: string;
  amount: number;
  onClose: () => void;
  lang: "en" | "ar";
  subscriptionId?: string;
  discountedAmount?: number;
  isFirstTimeSubscriber?: boolean;
}

export default function CheckoutForm({
  // clientSecret,
  amount,
  discountedAmount,
  isFirstTimeSubscriber,
  onClose,
  lang,
  subscriptionId,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [loading, setLoading] = useState(false);

  const finalAmount = isFirstTimeSubscriber
    ? discountedAmount || amount
    : amount;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      return;
    }

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMessage(submitError.message);
      setLoading(false);
      return;
    }

    // If we have a subscriptionId, we're confirming a subscription
    if (subscriptionId) {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/${lang}/success?subscription_id=${subscriptionId}`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      }
    } else {
      // Fallback to regular payment confirmation
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/${lang}/success?amount=${finalAmount}`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">
          {lang === "en" ? "Complete Payment" : "إتمام الدفع"}
        </h3>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          {isFirstTimeSubscriber && (
            <div className="mb-2">
              <div className="text-sm text-gray-600">
                {lang === "en" ? "Regular price" : "السعر العادي"}
              </div>
              <div className="text-lg line-through text-gray-400">
                ${amount}
              </div>
            </div>
          )}
          <div>
            <div className="text-sm text-gray-600">
              {isFirstTimeSubscriber
                ? lang === "en"
                  ? "Special offer price"
                  : "سعر العرض الخاص"
                : lang === "en"
                ? "Amount to pay"
                : "المبلغ المطلوب"}
            </div>
            <div className="text-2xl font-bold text-green-600">
              ${finalAmount}
            </div>
            {isFirstTimeSubscriber && (
              <div className="mt-1 text-sm text-green-600">
                {lang === "en" ? "50% off applied!" : "تم تطبيق خصم 50٪!"}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <PaymentElement />
          {errorMessage && (
            <div className="text-red-500 mt-2 text-sm">{errorMessage}</div>
          )}
          <div className="flex gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {lang === "en" ? "Cancel" : "إلغاء"}
            </Button>
            <Button type="submit" disabled={!stripe || loading}>
              {loading
                ? lang === "en"
                  ? "Processing..."
                  : "جاري المعالجة..."
                : lang === "en"
                ? `Pay $${finalAmount}`
                : `ادفع $${finalAmount}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
