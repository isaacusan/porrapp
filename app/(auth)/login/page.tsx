import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar · PORRAPP" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl">¡Hola de nuevo!</h1>
        <p className="text-sm text-muted-foreground">
          Entra para marcar tus porras.
        </p>
      </div>
      <LoginForm next={searchParams.next} initialError={searchParams.error} />
    </div>
  );
}
