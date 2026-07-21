import EditProfileComp from "@/components/auth/en/EditProfileComp";

export const metadata = {
  title: "Edit Profile | Bio Pharma Stock",
  robots: { index: false, follow: true },
};

export default function EditProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <EditProfileComp />
    </div>
  );
}
