"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { inviteByEmailAction, type ActionState } from "@/lib/email/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/auth/form-bits";
import { cn } from "@/lib/utils";
import { Check, Copy, Link2, Mail, Send } from "lucide-react";

const emailInitial: ActionState = {};

function CopyButton({
  text,
  label,
}: {
  text: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — user can still select manually */
    }
  }
  return (
    <Button
      type="button"
      variant={copied ? "lime" : "outline"}
      size="sm"
      onClick={copy}
      aria-label={label}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? "¡Copiado!" : "Copiar"}
    </Button>
  );
}

export function InvitePanel({
  tournamentId,
  tournamentName,
  inviteCode,
  joinUrl,
}: {
  tournamentId: string;
  tournamentName: string;
  inviteCode: string;
  joinUrl: string;
}) {
  const [emailState, emailAction] = useFormState(inviteByEmailAction, emailInitial);
  const shareText = `¡Únete a mi porra del Mundial "${tournamentName}" en PORRAPP! ⚽\n\nEntra aquí: ${joinUrl}\n\nO con el código: ${inviteCode}`;

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const emailHref = `mailto:?subject=${encodeURIComponent(
    `Únete a "${tournamentName}" en PORRAPP`,
  )}&body=${encodeURIComponent(shareText)}`;

  return (
    <div className="space-y-5">
      {/* Code */}
      <div>
        <p className="mb-1.5 text-sm font-semibold text-foreground/90">
          Código de invitación
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl border-2 border-dashed border-input bg-secondary px-4 py-3 text-center font-display text-3xl tracking-widest">
            {inviteCode}
          </div>
          <CopyButton text={inviteCode} label="Copiar código" />
        </div>
      </div>

      {/* Link */}
      <div>
        <p className="mb-1.5 text-sm font-semibold text-foreground/90">
          Enlace de invitación
        </p>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 overflow-hidden rounded-xl border-2 border-input bg-card px-3 py-2.5">
            <Link2 className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm text-muted-foreground">
              {joinUrl}
            </span>
          </div>
          <CopyButton text={joinUrl} label="Copiar enlace" />
        </div>
      </div>

      {/* Share buttons */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ size: "lg" }),
            "bg-[#25D366] text-white hover:brightness-105",
          )}
        >
          WhatsApp
        </a>
        <a
          href={emailHref}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          <Mail />
          Email
        </a>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Quien reciba el enlace solo tiene que iniciar sesión (o registrarse) para
        unirse.
      </p>

      {/* Send invite by email directly */}
      <form action={emailAction} className="border-t border-border pt-4">
        <p className="mb-1.5 text-sm font-semibold text-foreground/90">
          Enviar invitación por email
        </p>
        <input type="hidden" name="tournamentId" value={tournamentId} />
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <Input
              type="email"
              name="email"
              placeholder="amigo@email.com"
              aria-label="Email del invitado"
            />
          </div>
          <SubmitButton size="default" variant="outline">
            <Send />
            Enviar
          </SubmitButton>
        </div>
        {emailState.message && (
          <Alert variant={emailState.ok ? "success" : "error"} className="mt-2">
            {emailState.message}
          </Alert>
        )}
      </form>
    </div>
  );
}
