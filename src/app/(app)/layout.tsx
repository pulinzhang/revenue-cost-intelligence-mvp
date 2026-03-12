import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <AppHeader email={session?.user?.email} />
      <main className="mx-auto w-full max-w-none px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
