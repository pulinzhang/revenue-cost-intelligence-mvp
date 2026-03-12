import { query } from "@/lib/db";

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  provider: string;
  role: string;
};

export async function findUserByEmail(email: string) {
  const res = await query<Pick<UserRow, "id" | "email">>(
    `select id, email
     from users
     where email = $1
     limit 1`,
    [email],
  );
  return res.rows[0] ?? null;
}

export async function insertLocalUser(opts: { email: string; passwordHash: string }) {
  const res = await query<{ id: string; email: string }>(
    `insert into users (email, password_hash, provider, role)
     values ($1, $2, 'local', 'user')
     returning id, email`,
    [opts.email, opts.passwordHash],
  );
  return res.rows[0];
}
