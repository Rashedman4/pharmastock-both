import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/modules/program/program.service";
import { requireAdmin } from "@/modules/program/route-helpers";

export const runtime = "nodejs";
const service = new ProgramService();

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const accounts = await service.listFirmBankAccounts();
    return NextResponse.json(accounts, { status: 200 });
  } catch (error: any) {
    console.error("Failed to load firm bank accounts:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to load firm bank accounts." },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    const result = await service.saveFirmBankAccount(auth.userId, {
      id: body?.id ? Number(body.id) : null,
      accountName: body?.accountName,
      bankName: body?.bankName,
      iban: body?.iban,
      swiftCode: body?.swiftCode,
      currency: body?.currency,
      country: body?.country,
      instructions: body?.instructions,
      isActive: body?.isActive !== false,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to save firm bank account:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to save firm bank account." },
      { status: 400 },
    );
  }
}
