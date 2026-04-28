import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getAuthUser } from "@/modules/program/route-helpers";
import {
  ALLOWED_EVIDENCE_EXTENSIONS,
  assertAllowedEvidenceBytes,
  assertAllowedEvidenceFileMetadata,
  getCloudinaryEvidenceConfig,
  getEvidenceExtensionFromMime,
  getSafeEvidenceUserPrefix,
  normalizeEvidenceKind,
  sanitizeEvidenceDisplayName,
} from "@/lib/evidence-security";

export const runtime = "nodejs";

function signCloudinaryParams(params: Record<string, string>, apiSecret: string) {
  const signatureBase = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${signatureBase}${apiSecret}`)
    .digest("hex");
}

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if ("error" in auth) return auth.error;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Image file is required." },
        { status: 400 },
      );
    }

    assertAllowedEvidenceFileMetadata(file);

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedMimeType = assertAllowedEvidenceBytes(
      new Uint8Array(buffer),
      file.type,
    );
    const extension = getEvidenceExtensionFromMime(detectedMimeType);

    if (!extension) {
      return NextResponse.json(
        { message: "Only JPG, PNG, or WEBP evidence images are allowed." },
        { status: 400 },
      );
    }

    const { cloudName, apiKey, apiSecret, folder } = getCloudinaryEvidenceConfig();
    const kind = normalizeEvidenceKind(formData.get("kind"));
    const timestamp = Math.floor(Date.now() / 1000);
    const assetFolder = `${folder}/${kind}`;
    const publicId = `${getSafeEvidenceUserPrefix(auth.userId)}-${crypto.randomUUID()}`;

    const signedParams = {
      allowed_formats: ALLOWED_EVIDENCE_EXTENSIONS.join(","),
      folder: assetFolder,
      public_id: publicId,
      timestamp: String(timestamp),
    };
    const signature = signCloudinaryParams(signedParams, apiSecret);

    const upstream = new FormData();
    upstream.append(
      "file",
      new Blob([new Uint8Array(buffer)], { type: detectedMimeType }),
      `${publicId}.${extension}`,
    );
    upstream.append("api_key", apiKey);
    upstream.append("timestamp", String(timestamp));
    upstream.append("folder", assetFolder);
    upstream.append("public_id", publicId);
    upstream.append("allowed_formats", ALLOWED_EVIDENCE_EXTENSIONS.join(","));
    upstream.append("signature", signature);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: upstream,
      },
    );

    const uploadJson = await uploadRes.json().catch(() => ({}));

    if (!uploadRes.ok) {
      return NextResponse.json(
        {
          message:
            uploadJson?.error?.message || "Failed to upload evidence image.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        url: uploadJson.secure_url,
        name: sanitizeEvidenceDisplayName(file.name),
        publicId: uploadJson.public_id,
        kind,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Failed to upload evidence:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to upload evidence." },
      { status: 400 },
    );
  }
}
