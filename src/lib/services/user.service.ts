import { hash } from "bcryptjs";
import { ApiError } from "@/lib/errors";
import { findUserByEmail, insertLocalUser } from "@/lib/repositories/user.repo";
import type { RegisterInput } from "@/lib/validators/user.schema";

export async function registerUser(input: RegisterInput) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new ApiError("User already exists", 409, "USER_EXISTS");
  }

  const passwordHash = await hash(input.password, 12);

  try {
    return await insertLocalUser({ email: input.email, passwordHash });
  } catch (error) {
    // Postgres unique violation (fallback for race conditions)
    const pgCode = (error as { code?: string } | null)?.code;
    if (pgCode === "23505") {
      throw new ApiError("User already exists", 409, "USER_EXISTS");
    }
    throw error;
  }
}
