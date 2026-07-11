import EditProfileComp from "@/components/auth/ar/EditProfileComp";

export const metadata = {
  title: "تعديل الملف الشخصي | Bio Pharma Stock",
};

export default function EditProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <EditProfileComp />
    </div>
  );
}
