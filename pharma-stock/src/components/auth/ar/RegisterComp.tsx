"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

const countryCodes = [
  { name: "اختر رمز البلد", code: "" },
  { name: "الأردن", code: "+962" },
  { name: "الإمارات العربية المتحدة", code: "+971" },
  { name: "البحرين", code: "+973" },
  { name: "السعودية", code: "+966" },
  { name: "العراق", code: "+964" },
  { name: "الكويت", code: "+965" },
  { name: "لبنان", code: "+961" },
  { name: "مصر", code: "+20" },
  { name: "عمان", code: "+968" },
  { name: "قطر", code: "+974" },
  { name: "United States", code: "+1" },
  { name: "United Kingdom", code: "+44" },
  { name: "Australia", code: "+61" },
  { name: "Germany", code: "+49" },
  { name: "France", code: "+33" },
  { name: "India", code: "+91" },
];

const errTranslate: { [key: string]: string } = {
  "User already exists": "المستخدم موجود بالفعل",
  "Registration successful. Verification code sent to your email.":
    "تم التسجيل بنجاح. تم إرسال رمز التحقق إلى بريدك الإلكتروني.",
  "Internal server error": "خطأ داخلي في الخادم",
  "Password must be at least 8 characters long.":
    "يجب أن تكون كلمة المرور مكونة من 8 أحرف على الأقل.",
  "Passwords do not match": "كلمات المرور غير متطابقة",
  "An error occurred. Please try again.": "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
};

export default function RegisterComp() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate password length
    if (formData.password.length < 8) {
      setError("يجب أن تكون كلمة المرور مكونة من 8 أحرف على الأقل.");
      return;
    }

    // Check if password and confirmPassword match
    if (formData.password !== formData.confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      return;
    }

    // Post request to the registration API
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.countryCode + formData.phoneNumber,
          password: formData.password,
        }),
      });

      if (res.ok) {
        // Redirect to the verification page and pass the email as a query parameter
        setSuccess(true);
        router.push(`/ar/auth/verify?email=${formData.email}`);
      } else {
        const data = await res.json();
        setError(data.message || "حدث خطأ ما.");
      }
    } catch (error) {
      console.log(error);
      setError("حدث خطأ ما. يرجى المحاولة مرة أخرى.");
    }
  };

  return (
    <>
      <Card className="max-w-md mx-auto" dir="rtl">
        <CardHeader>
          <CardTitle className="text-royalBlue">إنشاء حساب جديد</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <p className="text-center text-green-500 mt-4">
              تم إنشاء حساب جديد بنجاح، جارٍ إعادة التوجيه إلى صفحة التحقق
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4 flex gap-4">
                <div className="flex-1">
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    htmlFor="firstName"
                  >
                    الاسم الأول
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="أدخل اسمك الأول"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex-1">
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    htmlFor="lastName"
                  >
                    الاسم الأخير
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="أدخل اسمك الأخير"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
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
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {/* Country code and phone number */}
              <div className="mb-4">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="phone"
                >
                  رقم الهاتف
                  <span className="text-xs">(اختياري)</span>
                </label>
                <div className="flex">
                  {/* Country code dropdown */}
                  <select
                    className="ml-2 p-2 border rounded text-sm"
                    value={formData.countryCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        countryCode: e.target.value,
                      })
                    }
                    style={{ direction: "ltr" }}
                  >
                    {countryCodes.map((code) => (
                      <option key={code.code} value={code.code}>
                        {code.name} {code.code}
                      </option>
                    ))}
                  </select>

                  {/* Phone number input */}
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="flex-grow"
                    placeholder="أدخل رقم هاتفك"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phoneNumber: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="mb-4">
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
                  required
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-6">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="confirmPassword"
                >
                  تأكيد كلمة المرور
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="أكد كلمة المرور الخاصة بك"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm mb-4">
                  {error in errTranslate ? errTranslate[error] : error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-brightTeal hover:bg-brightTeal/90 text-pureWhite font-bold"
              >
                إنشاء حساب جديد
              </Button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-gray-500">
            لديك حساب بالفعل؟{" "}
            <Link
              href="/ar/auth/login"
              className="text-brightTeal hover:text-brightTeal/90"
            >
              تسجيل الدخول من هنا
            </Link>
          </p>
        </CardContent>
      </Card>
    </>
  );
}
