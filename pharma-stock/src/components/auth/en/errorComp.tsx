"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Error() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  return (
    <div>
      <h1 text-royalBlue>Authentication Error</h1>
      {error && <p>{error}</p>} {/* Display the error message */}
      <a href="/auth/login">Go back to login</a>
    </div>
  );
}
export default function ErrorComp() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Error />
    </Suspense>
  );
}
