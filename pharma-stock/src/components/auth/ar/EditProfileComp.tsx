"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phonenumber: string;
  provider: string | null;
}

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  phonenumber?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function EditProfileComp() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phonenumber, setPhonenumber] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetch("/api/auth/profile")
      .then((r) => r.json())
      .then((data: ProfileData) => {
        setProfile(data);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setPhonenumber(data.phonenumber ?? "");
      })
      .catch(() =>
        toast({ title: "خطأ", description: "تعذّر تحميل الملف الشخصي.", variant: "destructive" })
      )
      .finally(() => setLoading(false));
  }, [toast]);

  const isSocial = profile?.provider === "google" || profile?.provider === "apple";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const errors: FieldErrors = {};
    if (!firstName.trim()) errors.firstName = "الاسم الأول مطلوب";
    if (!lastName.trim()) errors.lastName = "اسم العائلة مطلوب";
    if (newPassword && newPassword.length < 8)
      errors.newPassword = "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل";
    if (newPassword && newPassword !== confirmPassword)
      errors.confirmPassword = "كلمتا المرور غير متطابقتين";
    if (newPassword && !currentPassword)
      errors.currentPassword = "كلمة المرور الحالية مطلوبة";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = { firstName, lastName, phonenumber };
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
        body.confirmPassword = confirmPassword;
      }

      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fields) {
          setFieldErrors(data.fields as FieldErrors);
        }
        toast({
          title: "خطأ",
          description: data.message ?? "فشل تحديث الملف الشخصي.",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "نجاح", description: "تم تحديث الملف الشخصي بنجاح." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ. يرجى المحاولة مجددًا.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="max-w-lg mx-auto mt-10">
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">جار التحميل...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto mt-10" dir="rtl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-royalBlue">تعديل الملف الشخصي</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="firstName">
                الاسم الأول
              </label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="أدخل اسمك الأول"
              />
              {fieldErrors.firstName && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="lastName">
                اسم العائلة
              </label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="أدخل اسم العائلة"
              />
              {fieldErrors.lastName && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
              البريد الإلكتروني
            </label>
            <Input id="email" value={profile?.email ?? ""} disabled className="bg-gray-50 text-gray-500" />
            <p className="text-xs text-gray-400 mt-1">لا يمكن تغيير البريد الإلكتروني.</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="phonenumber">
              رقم الهاتف <span className="text-xs text-gray-400">(اختياري)</span>
            </label>
            <Input
              id="phonenumber"
              type="tel"
              value={phonenumber}
              onChange={(e) => setPhonenumber(e.target.value)}
              placeholder="+966 5X XXX XXXX"
            />
            {fieldErrors.phonenumber && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.phonenumber}</p>
            )}
          </div>

          <hr className="my-6" />

          <p className="text-sm font-semibold text-gray-700 mb-4">تغيير كلمة المرور</p>

          {isSocial ? (
            <div className="rounded-md bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700 mb-4">
              {profile?.provider === "google"
                ? "تم تسجيل الدخول عبر Google — تُدار كلمة المرور من قِبل المزوّد."
                : "تم تسجيل الدخول عبر Apple — تُدار كلمة المرور من قِبل المزوّد."}
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="currentPassword">
                  كلمة المرور الحالية
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الحالية"
                />
                {fieldErrors.currentPassword && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.currentPassword}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="newPassword">
                  كلمة المرور الجديدة
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الجديدة"
                />
                {fieldErrors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.newPassword}</p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="confirmPassword">
                  تأكيد كلمة المرور الجديدة
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أكّد كلمة المرور الجديدة"
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-brightTeal hover:bg-brightTeal/90 text-pureWhite font-bold"
          >
            {saving ? "جار الحفظ..." : "حفظ التغييرات"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
