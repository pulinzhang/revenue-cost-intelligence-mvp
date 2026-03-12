import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { handleApiError, unauthorized } from "@/lib/errors";
import { validate } from "@/lib/validate";
import { fetchFinanceSummary } from "@/lib/services/financeSummary.service";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) unauthorized();

    const { searchParams } = new URL(req.url);
    const params = validate(
      z.object({
        startDate: z.string().min(1),
        endDate: z.string().min(1),
        region: z.string().optional(),
        shopId: z.string().optional(),
      }),
      {
        startDate: searchParams.get("startDate") ?? undefined,
        endDate: searchParams.get("endDate") ?? undefined,
        region: searchParams.get("region") ?? undefined,
        shopId: searchParams.get("shopId") ?? undefined,
      },
      "Invalid params",
    );

    const summary = await fetchFinanceSummary(params);
    return NextResponse.json(summary);
  } catch (error) {
    return handleApiError(error);
  }
}

