import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <Logo size="lg" />
      <div>
        <p className="font-display text-7xl text-pitch">404</p>
        <p className="mt-1 text-lg text-muted-foreground">
          Esta jugada se ha ido fuera. La página no existe.
        </p>
      </div>
      <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
        Volver al inicio
      </Link>
    </div>
  );
}
