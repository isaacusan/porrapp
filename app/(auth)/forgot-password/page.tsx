import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Recuperar contraseña · PORRAPP" };

export default function ForgotPasswordPage() {
  return <ForgotForm />;
}
