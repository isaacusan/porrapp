import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-border py-6">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 px-4 text-center text-xs text-muted-foreground">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/legal/reglas" className="hover:text-foreground">
            Normas y puntuación
          </Link>
          <Link href="/legal/privacy" className="hover:text-foreground">
            Privacidad
          </Link>
          <Link href="/legal/terms" className="hover:text-foreground">
            Condiciones
          </Link>
        </nav>
        <p>PORRAPP · hecho para picarse con los amigos ⚽</p>
      </div>
    </footer>
  );
}
