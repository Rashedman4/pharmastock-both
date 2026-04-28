export const ALLOWED_EVIDENCE_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const EVIDENCE_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const MAX_EVIDENCE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

type EvidenceKind = "opening" | "closing" | "payment";

export function validateEvidenceImageFile(file: File) {
  if (!ALLOWED_EVIDENCE_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_EVIDENCE_IMAGE_TYPES)[number])) {
    throw new Error("Only JPG, PNG, or WEBP evidence images are allowed.");
  }

  if (file.size <= 0) {
    throw new Error("Evidence image is empty.");
  }

  if (file.size > MAX_EVIDENCE_IMAGE_SIZE_BYTES) {
    throw new Error("Evidence image must be 5 MB or smaller.");
  }
}

export async function uploadEvidence(
  file: File,
  kind: EvidenceKind = "opening",
) {
  validateEvidenceImageFile(file);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", kind);

  const res = await fetch("/api/uploads/evidence", {
    method: "POST",
    body: formData,
  });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.message || "Failed to upload evidence.");
  }

  return {
    url: String(json.url || ""),
    name: String(json.name || file.name),
  };
}
