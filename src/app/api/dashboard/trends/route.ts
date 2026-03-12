import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { handleApiError, unauthorized } from "@/lib/errors";
import { fetchRevenueCostTrends } from "@/lib/services/dashboard.service";
import { validate } from "@/lib/validate";

export async function GET(req: Request) {
  try {
  const session = await getServerSession(authOptions);
    if (!session?.user?.id) unauthorized();

  const { searchParams } = new URL(req.url);
    const params = validate(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
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

    const trends = await fetchRevenueCostTrends(params);

  return NextResponse.json({ trends });
  } catch (error) {
    return handleApiError(error);
  }
}
