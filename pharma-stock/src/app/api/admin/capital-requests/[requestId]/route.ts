import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";
import { createNotification } from "@/lib/services/notification.service";

export const runtime = "nodejs";
const service = new ProgramService();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { requestId } = await params;
    const body = await request.json().catch(() => ({}));
    const decision = String(body?.decision || "");
    const result = await service.respondCapitalChangeRequest(
      auth.userId,
      Number(requestId),
      decision,
      body?.reviewNote ? String(body.reviewNote) : null,
    );

    try {
      const approved = result.status === "APPROVED";
      await createNotification({
        userId: result.investorUserId,
        type: "capital_request_update",
        title_en: approved ? "Capital Change Approved" : "Capital Change Rejected",
        title_ar: approved ? "تمت الموافقة على تغيير رأس المال" : "تم رفض تغيير رأس المال",
        body_en: approved
          ? `Your capital change request has been approved. Free capital updated to $${Number(result.requestedCapitalAmount).toLocaleString()}.`
          : "Your capital change request was rejected by the admin.",
        body_ar: approved
          ? `تمت الموافقة على طلب تغيير رأس المال. تم تحديث رأس المال الحر إلى $${Number(result.requestedCapitalAmount).toLocaleString()}.`
          : "تم رفض طلب تغيير رأس المال من قبل المشرف.",
        data: { screen: "portfolio" },
      });
    } catch (notifErr) {
      console.error("[Notification] capital_request_update:", notifErr);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to review capital change request:", error);
    return NextResponse.json({ message: error?.message || "Failed to review capital change request." }, { status: 400 });
  }
}
