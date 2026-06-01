import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/lib/auth/actions";
import { Logo } from "@/components/brand/logo";
import { Footer } from "@/components/brand/footer";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth: middleware already guards this, but never trust one layer.
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            {profile?.username && (
              <span className="hidden text-sm font-semibold text-muted-foreground sm:inline">
                @{profile.username}
              </span>
            )}
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                aria-label="Cerrar sesión"
              >
                <LogOut />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container py-6">{children}</main>
      <Footer />
    </div>
  );
}
