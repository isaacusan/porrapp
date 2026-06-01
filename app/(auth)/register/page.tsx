import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Crear cuenta · PORRAPP" };

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return <RegisterForm next={searchParams.next} />;
}
