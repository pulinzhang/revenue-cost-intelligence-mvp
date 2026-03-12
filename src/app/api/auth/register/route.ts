import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors";
import { registerUser } from "@/lib/services/user.service";
import { registerSchema } from "@/lib/validators/user.schema";
import { parseJson } from "@/lib/validate";

export async function POST(req: Request) {
  try {
    const input = await parseJson(req, registerSchema);
    const user = await registerUser(input);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
