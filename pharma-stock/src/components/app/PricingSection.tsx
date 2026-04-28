"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, ArrowLeft, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./CheckoutForm";
import { useSession } from "next-auth/react";
import { format } from "date-fns";

/* const pricingPlans = [
  {
    //id: "price_1RBLSCRpsg73CUGeQ4Fw4Ufx",
    id: "price_1Qz7r5Rpsg73CUGeCexgf4TN",
    name: "1 Day",
    nameAr: "1 أسبوع",
    price: 2.0,
    discountedPrice: 1.0,
    interval: "Daily",
    intervalAr: "أسبوع",
  },
  {
    //id: "price_1RBLSnRpsg73CUGevmKcL4iY",
    id: "price_1Qz7rpRpsg73CUGegjYOj3Ag",
    name: "3 Months",
    nameAr: "3 أشهر",
    price: 49.99,
    discountedPrice: 24.99,
    interval: "quarter",
    intervalAr: "ربع",
    popular: true,
  },
  {
    // id: "price_1RBLTCRpsg73CUGebkUMJOa7",
    id: "price_1Qz7sKRpsg73CUGeas3PqPQL",
    name: "6 Months",
    nameAr: "6 أشهر",
    price: 79.99,
    discountedPrice: 39.99,
    interval: "half-year",
    intervalAr: "نصف سنة",
  },
]; */
const pricingPlans = [
  {
    id: "price_1RBLSCRpsg73CUGeQ4Fw4Ufx",
    //id: "price_1Qz7r5Rpsg73CUGeCexgf4TN",
    name: "1 Day",
    nameAr: "1 أسبوع",
    price: 2.0,
    discountedPrice: 1.0,
    interval: "Daily",
    intervalAr: "أسبوع",
  },
  {
    //id: "price_1RBLSnRpsg73CUGevmKcL4iY",
    //id: "price_1Qz7rpRpsg73CUGegjYOj3Ag",
    id: "price_1RHbqcRpsg73CUGen9r0hCBG",
    name: "3 Months",
    nameAr: "3 أشهر",
    price: 100.0,
    discountedPrice: 50.0,
    interval: "quarter",
    intervalAr: "ربع",
    popular: true,
  },
  {
    // id: "price_1RBLTCRpsg73CUGebkUMJOa7",
    id: "price_1Qz7sKRpsg73CUGeas3PqPQL",
    name: "6 Months",
    nameAr: "6 أشهر",
    price: 160.0,
    discountedPrice: 80.0,
    interval: "half-year",
    intervalAr: "نصف سنة",
  },
];
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY) {
  throw new Error("NEXT_PUBLIC_STRIPE_PUBLIC_KEY is not defined");
}

/* const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!, {
  locale: "en", // or 'ar' based on your needs
}); */

interface LangProps {
  lang: "en" | "ar";
}

const translations = {
  en: {
    title: "Choose Your Plan",
    subtitle: "Select the perfect plan for your investment journey",
    features: "All Plans Include",
    activeUntil: "Your subscription is active until",
    subscribe: "Subscribe Now",
    processing: "Processing...",
    alreadySubscribed: "Already Subscribed",
    commonFeatures: [
      "Real-time market insights",
      "Pharmaceutical stock picks",
      "Daily market updates",
      "WhatsApp alerts",
    ],
    subscriptionNote: "Important Note:",
    subscriptionNoteContent:
      "Your subscription will automatically renew at the end of each billing period. To cancel, use the 'Cancel Subscription' button above. The cancellation will take effect at the end of your current billing period. To change your plan, you'll need to cancel your current subscription first, wait for it to end, and then subscribe to your desired plan.",
    viewHistory: "View History",
    viewHistoryInactive: "View Payment History",
    specialOffer: "Special Offer",
    firstBillDiscount: "50% OFF on your first bill",
    regularPrice: "Regular price",
    discountedPrice: "First bill",
    nextBills: "Next bills at regular price",
  },
  ar: {
    title: "اختر خطتك",
    subtitle: "اختر الخطة المثالية لرحلة استثمارك",
    features: "جميع الخطط تشمل",
    activeUntil: "اشتراكك فعال حتى",
    subscribe: "اشترك الآن",
    processing: "...جاري المعالجة",
    alreadySubscribed: "مشترك بالفعل",
    commonFeatures: [
      "تحليل السوق في الوقت الفعلي",
      "توصيات لأسهم شركات الأدوية",
      "تقارير السوق اليومية",
      "إشعارات واتساب",
    ],
    subscriptionNote: "ملاحظة هامة:",
    subscriptionNoteContent:
      "سيتم تجديد اشتراكك تلقائياً في نهاية كل فترة فوترة. للإلغاء، استخدم زر 'إلغاء الاشتراك' أعلاه. سيبدأ الإلغاء في نهاية فترة الفوترة الحالية. لتغيير خطتك، ستحتاج إلى إلغاء اشتراكك الحالي أولاً، والانتظار حتى ينتهي، ثم الاشتراك في الخطة المطلوبة.",
    viewHistory: "عرض السجل",
    viewHistoryInactive: "عرض سجل المدفوعات",
    specialOffer: "عرض خاص",
    firstBillDiscount: "خصم 50% على الفاتورة الأولى",
    regularPrice: "السعر العادي",
    discountedPrice: "الفاتورة الأولى",
    nextBills: "الفواتير التالية بالسعر العادي",
  },
};

interface SubscriptionStatus {
  isActive: boolean;
  endDate: string | null;
  cancelAtPeriodEnd: boolean;
  isFirstTime: boolean;
}

export default function PricingSection({ lang }: LangProps) {
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!, {
    locale: lang,
  });
  const { status } = useSession(); // Access the session data
  const [loading, setLoading] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<
    (typeof pricingPlans)[0] | null
  >(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>({
      isActive: false,
      endDate: null,
      cancelAtPeriodEnd: false,
      isFirstTime: true,
    });
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch("/api/subscriptions/status");
      const data = await response.json();
      setSubscriptionStatus(data);
    } catch (error) {
      console.error("Error fetching subscription status:", error);
    }
  };

  const fetchTransactionHistory = useCallback(async () => {
    if (status !== "authenticated") return;

    setHistoryLoading(true);
    try {
      const response = await fetch("/api/subscriptions/history", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.ok) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Error fetching transaction history:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, [status]);

  const handleCancelSubscription = async () => {
    if (status !== "authenticated") return;

    setCancelLoading(true);
    setCancelMessage({ type: null, message: "" });

    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (response.ok) {
        setCancelMessage({
          type: "success",
          message:
            lang === "en"
              ? "Your subscription will be canceled at the end of the billing period"
              : "سيتم إلغاء اشتراكك في نهاية فترة الفوترة",
        });
        // Refresh subscription status
        fetchSubscriptionStatus();
      } else {
        setCancelMessage({
          type: "error",
          message:
            data.error ||
            (lang === "en"
              ? "Failed to cancel subscription"
              : "فشل في إلغاء الاشتراك"),
        });
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      setCancelMessage({
        type: "error",
        message:
          lang === "en"
            ? "An error occurred while canceling your subscription"
            : "حدث خطأ أثناء إلغاء اشتراكك",
      });
    } finally {
      setCancelLoading(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const msg = searchParams.get("message");
    if (msg) {
      setMessage(decodeURIComponent(msg));
    }
    fetchSubscriptionStatus();
  }, []);

  useEffect(() => {
    if (showHistory) {
      fetchTransactionHistory();
    }
  }, [showHistory, status, fetchTransactionHistory]);

  const handleSubscribe = async (plan: (typeof pricingPlans)[0]) => {
    if (status !== "authenticated") {
      setShowModal(true);
      return;
    }
    setLoading(plan.id);
    try {
      const response = await fetch("/api/payments/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: plan.id,
          isFirstTimeSubscriber: subscriptionStatus.isFirstTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Subscription setup failed:", data.error);
        return;
      }

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setSelectedPlan(plan);
        setSubscriptionId(data.subscriptionId);
      }
    } catch (error) {
      console.error("Subscription error:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleCloseCheckout = () => {
    setClientSecret(null);
    setSelectedPlan(null);
  };

  const t = translations[lang];

  return (
    <>
      <section className="py-20 bg-gradient-to-br from-royalBlue to-brightTeal">
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            >
              <Card className="p-6 max-w-md bg-white shadow-lg rounded-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">
                    {lang === "en"
                      ? "Authentication Required"
                      : "مطلوب تسجيل الدخول"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-gray-700">
                    {lang === "en"
                      ? "You need to be logged in to subscribe."
                      : "يجب عليك تسجيل الدخول للاشتراك."}
                  </p>
                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowModal(false)}
                      className="border-gray-300 text-gray-700"
                    >
                      {lang === "en" ? "Cancel" : "إلغاء"}
                    </Button>
                    <Button
                      className="bg-brightTeal text-white"
                      onClick={() => {
                        setShowModal(false);
                        window.location.href = "/auth/login";
                      }}
                    >
                      {lang === "en" ? "Login" : "تسجيل الدخول"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">{t.title}</h2>
            {subscriptionStatus.isActive && (
              <div className="mt-8 mx-auto max-w-4xl">
                <div className="rounded-lg bg-white/10 p-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {subscriptionStatus.cancelAtPeriodEnd
                          ? lang === "en"
                            ? "Subscription Status"
                            : "حالة الأشتراك"
                          : lang === "en"
                          ? "Active Subscription"
                          : "الأشتراك فعال"}
                      </h3>
                      <p className="mt-2 text-sm text-white">
                        {subscriptionStatus.cancelAtPeriodEnd
                          ? lang === "en"
                            ? `Your subscription will end on ${format(
                                new Date(subscriptionStatus.endDate!),
                                "MMMM d, yyyy"
                              )}`
                            : `ستنتهي صلاحية اشتراكك في ${format(
                                new Date(subscriptionStatus.endDate!),
                                "MMMM d, yyyy"
                              )}`
                          : lang === "en"
                          ? `Your subscription is active until ${format(
                              new Date(subscriptionStatus.endDate!),
                              "MMMM d, yyyy"
                            )}`
                          : `اشتراكك فعال حتى ${format(
                              new Date(subscriptionStatus.endDate!),
                              "MMMM d, yyyy"
                            )}`}
                      </p>
                    </div>
                    <div
                      className={`flex ${
                        lang === "ar" ? "flex-row-reverse" : "flex-row"
                      } gap-4`}
                    >
                      <button
                        onClick={() => setShowHistory(true)}
                        className="inline-flex items-center rounded-md bg-brightTeal px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brightTeal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brightTeal transition-colors duration-200"
                      >
                        {lang === "en" ? t.viewHistory : t.viewHistoryInactive}
                      </button>
                      {!subscriptionStatus.cancelAtPeriodEnd && (
                        <button
                          onClick={handleCancelSubscription}
                          disabled={cancelLoading}
                          className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-20 transition-colors duration-200"
                        >
                          {cancelLoading
                            ? lang === "en"
                              ? "Cancelling..."
                              : "...جاري الإلغاء"
                            : lang === "en"
                            ? "Cancel Subscription"
                            : "إلغاء الاشتراك"}
                        </button>
                      )}
                    </div>
                  </div>
                  {cancelMessage.type && (
                    <div
                      className={`mt-4 p-3 rounded-md ${
                        cancelMessage.type === "success"
                          ? "bg-green-50 text-green-800 border border-green-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                    >
                      {cancelMessage.message}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Subscription Note */}
            <div className="mt-8 mx-auto max-w-4xl">
              <div className="rounded-lg bg-white/10 p-4">
                <h4 className="text-lg font-semibold text-white mb-2">
                  {t.subscriptionNote}
                </h4>
                <p className="text-sm text-white/90">
                  {t.subscriptionNoteContent}
                </p>
              </div>
            </div>
            {/* History Button for Inactive Users */}
            {!subscriptionStatus.isActive && (
              <div className="mt-8 mx-auto max-w-4xl text-center">
                <button
                  onClick={() => setShowHistory(true)}
                  className="inline-flex items-center rounded-md bg-brightTeal/20 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brightTeal/30 transition-colors duration-200"
                >
                  {lang === "en" ? t.viewHistoryInactive : t.viewHistory}
                </button>
              </div>
            )}
            {message && (
              <div className="bg-white/10 p-4 rounded-lg mt-4">
                <p className="text-white">{message}</p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-12 max-w-2xl mx-auto"
          >
            <h3 className="text-xl font-semibold text-white mb-4">
              {t.features}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {t.commonFeatures.map((feature) => (
                <div key={feature} className="flex items-center text-white">
                  <Check className="h-5 w-5 text-brightTeal mr-2" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`relative ${
                    plan.popular ? "border-brightTeal" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brightTeal text-white px-4 py-1 rounded-full text-sm">
                      {lang == "en" ? "Most Popular" : "الأكثر طلبا"}
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">
                      {lang === "ar" ? plan.nameAr : plan.name}
                    </CardTitle>
                    <div className="text-center mt-4">
                      {subscriptionStatus.isFirstTime ||
                      subscriptionStatus.isFirstTime == null ? (
                        <>
                          <div className="mb-2">
                            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                              {t.specialOffer}
                            </span>
                          </div>

                          <div className="mb-2">
                            <span className="text-sm text-gray-600">
                              {t.discountedPrice}
                            </span>
                            <div>
                              <span className="text-4xl font-bold text-brightTeal">
                                ${plan.discountedPrice}
                              </span>
                              <span className="text-gray-600">
                                /{" "}
                                {lang === "ar"
                                  ? plan.intervalAr
                                  : plan.interval}
                              </span>
                            </div>
                          </div>

                          <div className="mt-2">
                            <span className="text-sm text-gray-600">
                              {t.nextBills}
                            </span>
                            <div>
                              <span className="text-2xl font-semibold">
                                ${plan.price}
                              </span>
                              <span className="text-gray-600">
                                /{" "}
                                {lang === "ar"
                                  ? plan.intervalAr
                                  : plan.interval}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div>
                          <span className="text-4xl font-bold">
                            ${plan.price}
                          </span>
                          <span className="text-gray-600">
                            / {lang === "ar" ? plan.intervalAr : plan.interval}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full bg-brightTeal hover:bg-brightTeal/90"
                      onClick={() => handleSubscribe(plan)}
                      disabled={!!loading || subscriptionStatus.isActive}
                    >
                      {loading === plan.id
                        ? t.processing
                        : subscriptionStatus.isActive
                        ? t.alreadySubscribed
                        : t.subscribe}
                      {lang === "en" ? (
                        <ArrowRight className="ml-2 h-5 w-5" />
                      ) : (
                        <ArrowLeft className="mr-2 h-5 w-5" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Transaction History Modal */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold">
                      {lang === "en" ? "Transaction History" : "سجل المعاملات"}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowHistory(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {historyLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brightTeal"></div>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {lang === "en"
                        ? "No transactions found"
                        : "لم يتم العثور على معاملات"}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="py-3 px-4 text-left">
                              {lang === "en" ? "Date" : "التاريخ"}
                            </th>
                            <th className="py-3 px-4 text-left">
                              {lang === "en" ? "Plan" : "الخطة"}
                            </th>
                            <th className="py-3 px-4 text-left">
                              {lang === "en"
                                ? "Original Amount"
                                : "المبلغ الأصلي"}
                            </th>
                            <th className="py-3 px-4 text-left">
                              {lang === "en" ? "Discount" : "الخصم"}
                            </th>
                            <th className="py-3 px-4 text-left">
                              {lang === "en"
                                ? "Final Amount"
                                : "المبلغ النهائي"}
                            </th>
                            <th className="py-3 px-4 text-left">
                              {lang === "en" ? "Status" : "الحالة"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map(
                            (transaction) =>
                              transaction.status != "open" && (
                                <tr key={transaction.id} className="border-b">
                                  <td className="py-3 px-4">
                                    {format(
                                      new Date(transaction.created_at),
                                      "MMM d, yyyy"
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    {transaction.package_name || "N/A"}
                                  </td>
                                  <td className="py-3 px-4">
                                    $
                                    {(
                                      (transaction.original_amount ||
                                        transaction.amount) / 100
                                    ).toFixed(2)}{" "}
                                    {transaction.currency.toUpperCase()}
                                  </td>
                                  <td className="py-3 px-4">
                                    {transaction.discount_amount ? (
                                      <span className="text-green-600">
                                        -$
                                        {(
                                          transaction.discount_amount / 100
                                        ).toFixed(2)}
                                      </span>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    ${(transaction.amount / 100).toFixed(2)}{" "}
                                    {transaction.currency.toUpperCase()}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs ${
                                        transaction.status === "paid"
                                          ? "bg-green-100 text-green-800"
                                          : transaction.status === "failed"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {transaction.status}
                                    </span>
                                  </td>
                                </tr>
                              )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {clientSecret && selectedPlan && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                },
              }}
            >
              <CheckoutForm
                clientSecret={clientSecret}
                amount={selectedPlan.price}
                discountedAmount={selectedPlan.discountedPrice}
                isFirstTimeSubscriber={subscriptionStatus.isFirstTime}
                onClose={handleCloseCheckout}
                lang={lang}
                subscriptionId={subscriptionId || undefined}
              />
            </Elements>
          )}
        </div>
      </section>
    </>
  );
}
