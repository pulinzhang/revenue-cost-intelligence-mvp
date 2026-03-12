import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { handleApiError, unauthorized } from "@/lib/errors";
import { fetchFinanceList } from "@/lib/services/finance.service";
import { validate } from "@/lib/validate";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) unauthorized();

    const { searchParams } = new URL(req.url);
    const parsed = validate(
      z.object({
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(200).default(50),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        region: z.string().optional(),
        shopId: z.string().optional(),
      }),
      {
        page: searchParams.get("page") ?? undefined,
        pageSize: searchParams.get("pageSize") ?? undefined,
        startDate: searchParams.get("startDate") ?? undefined,
        endDate: searchParams.get("endDate") ?? undefined,
        region: searchParams.get("region") ?? undefined,
        shopId: searchParams.get("shopId") ?? undefined,
      },
      "Invalid params",
    );

    const result = await fetchFinanceList(parsed);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
