export type UserRole = "user" | "admin";
export type AuthProvider = "azure" | "local";

export type DbUser = {
  id: string;
  email: string;
  password_hash: string | null;
  provider: AuthProvider;
  role: UserRole;
};

export type AppUser = {
  id: string;
  email: string;
  role: UserRole;
};
