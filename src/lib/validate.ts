import { z, ZodError } from "zod";
import { ApiError } from "@/lib/errors";

export type ZodIssueDto = {
  path: (string | number)[];
  message: string;
  code: string;
};

export function formatZodError(error: ZodError): { issues: ZodIssueDto[] } {
  return {
    issues: error.issues.map((i) => ({
      // Zod's issue path can include `PropertyKey` (string | number | symbol) in newer typings.
      // Our API DTO intentionally excludes `symbol`, so we normalize everything to string/number.
      path: i.path.map((p) => (typeof p === "symbol" ? (p.description ?? p.toString()) : p)),
      message: i.message,
      code: i.code,
    })),
  };
}

export function validate<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  data: unknown,
  message: string = "Validation Failed",
) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(message, 400, "VALIDATION_ERROR", formatZodError(parsed.error));
  }
  return parsed.data as z.infer<TSchema>;
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError("Invalid JSON", 400, "INVALID_JSON");
  }
}

export async function parseJson<TSchema extends z.ZodTypeAny>(
  req: Request,
  schema: TSchema,
  message?: string,
) {
  const body = await readJson(req);
  return validate(schema, body, message);
}
