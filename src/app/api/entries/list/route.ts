import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { handleApiError, unauthorized } from "@/lib/errors";
import { listEntries } from "@/lib/services/entry.service";
import { validate } from "@/lib/validate";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) unauthorized();

    const { searchParams } = new URL(req.url);
    const parsed = validate(
      z.object({
        limit: z.coerce.number().int().positive().max(200).default(50),
      }),
      { limit: searchParams.get("limit") ?? undefined },
      "Invalid params",
    );

    const entries = await listEntries({ limit: parsed.limit });
    return NextResponse.json({ entries });
  } catch (error) {
    return handleApiError(error);
  }
}
