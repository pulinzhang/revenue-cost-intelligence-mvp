import { withAuth } from "next-auth/middleware";

export const middleware = withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|login).*)"],
};
