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
        toast({ title: "Error", description: "Could not load profile.", variant: "destructive" })
      )
      .finally(() => setLoading(false));
  }, [toast]);

  const isSocial = profile?.provider === "google" || profile?.provider === "apple";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const errors: FieldErrors = {};
    if (!firstName.trim()) errors.firstName = "First name is required";
    if (!lastName.trim()) errors.lastName = "Last name is required";
    if (newPassword && newPassword.length < 8)
      errors.newPassword = "Password must be at least 8 characters";
    if (newPassword && newPassword !== confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    if (newPassword && !currentPassword)
      errors.currentPassword = "Current password is required";

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
          title: "Error",
          description: data.message ?? "Failed to update profile.",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Success", description: "Profile updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="max-w-lg mx-auto mt-10">
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto mt-10">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-royalBlue">Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="firstName">
                First Name
              </label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
              />
              {fieldErrors.firstName && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="lastName">
                Last Name
              </label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
              />
              {fieldErrors.lastName && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
              Email
            </label>
            <Input id="email" value={profile?.email ?? ""} disabled className="bg-gray-50 text-gray-500" />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="phonenumber">
              Phone Number <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <Input
              id="phonenumber"
              type="tel"
              value={phonenumber}
              onChange={(e) => setPhonenumber(e.target.value)}
              placeholder="+1 234 567 8900"
            />
            {fieldErrors.phonenumber && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.phonenumber}</p>
            )}
          </div>

          <hr className="my-6" />

          <p className="text-sm font-semibold text-gray-700 mb-4">Change Password</p>

          {isSocial ? (
            <div className="rounded-md bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700 mb-4">
              {profile?.provider === "google"
                ? "Signed in with Google — password is managed by your provider."
                : "Signed in with Apple — password is managed by your provider."}
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="currentPassword">
                  Current Password
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                {fieldErrors.currentPassword && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.currentPassword}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="newPassword">
                  New Password
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                {fieldErrors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.newPassword}</p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
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
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
