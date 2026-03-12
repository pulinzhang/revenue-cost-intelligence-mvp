import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { handleApiError, unauthorized } from "@/lib/errors";
import { createEntry } from "@/lib/services/entry.service";
import { createEntrySchema } from "@/lib/validators/entry.schema";
import { parseJson } from "@/lib/validate";

export async function POST(req: Request) {
  try {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
    if (!userId) unauthorized();

    const input = await parseJson(req, createEntrySchema);

  const entry = await createEntry({
      type: input.type,
      amount: input.amount,
      description: input.description,
    createdBy: userId,
  });

  return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
