import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ArrowLeft } from "lucide-react";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" aria-label="PORRAPP">
            <Logo size="sm" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="space-y-4 [&_a]:font-semibold [&_a]:text-pitch [&_h1]:text-4xl [&_h2]:mt-6 [&_h2]:text-2xl [&_li]:ml-1 [&_p]:leading-relaxed [&_p]:text-foreground/90 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:text-foreground/90">
          {children}
        </article>
      </main>
    </div>
  );
}
