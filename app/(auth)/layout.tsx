import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand / stadium side (hidden on small screens) */}
      <aside className="pitch-backdrop grain relative hidden flex-col justify-between overflow-hidden p-10 text-pitch-foreground lg:flex">
        <div className="relative z-10">
          <Logo size="md" tone="light" />
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-5xl text-pitch-foreground">
            La porra del Mundial,
            <br />
            <span className="text-lime">entre amigos.</span>
          </h2>
          <p className="mt-4 text-lg text-pitch-foreground/80">
            Predice marcadores, abre cofres, gana powerups y demuestra quién es
            el verdadero profeta del gol. ⚽🏆
          </p>
        </div>
        <p className="relative z-10 text-sm text-pitch-foreground/60">
          Privado · Sin dinero · Solo por el honor
        </p>
      </aside>

      {/* Form side */}
      <main className="flex flex-col">
        <header className="flex items-center justify-center p-6 lg:hidden">
          <Logo size="sm" />
        </header>
        <div className="flex flex-1 items-center justify-center p-6 pb-16">
          <div className="w-full max-w-sm animate-fade-up">{children}</div>
        </div>
      </main>
    </div>
  );
}
