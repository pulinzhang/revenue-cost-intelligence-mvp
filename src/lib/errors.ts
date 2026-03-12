import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation Failed",
        code: "VALIDATION_ERROR",
        details: {
          issues: error.issues.map((i) => ({
            path: i.path,
            message: i.message,
            code: i.code,
          })),
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export function unauthorized(message: string = "Unauthorized"): never {
  throw new ApiError(message, 401, "UNAUTHORIZED");
}

export function forbidden(message: string = "Forbidden"): never {
  throw new ApiError(message, 403, "FORBIDDEN");
}

export function notFound(message: string = "Not Found"): never {
  throw new ApiError(message, 404, "NOT_FOUND");
}

export function validationError(message: string = "Validation Failed", code?: string): never {
  throw new ApiError(message, 400, code || "VALIDATION_ERROR");
}
