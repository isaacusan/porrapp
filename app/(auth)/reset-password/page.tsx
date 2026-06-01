import type { Metadata } from "next";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = { title: "Nueva contraseña · PORRAPP" };

export default function ResetPasswordPage() {
  return <ResetForm />;
}
