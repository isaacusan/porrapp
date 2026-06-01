"use client";

import { useFormState } from "react-dom";
import {
  updateSyncConfigAction,
  syncNowAction,
  type ActionState,
} from "@/lib/football/actions";
import { PROVIDER_OPTIONS } from "@/lib/football/providers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/auth/form-bits";
import { RefreshCw } from "lucide-react";

const initial: ActionState = {};
const selectCls =
  "h-12 w-full rounded-xl border-2 border-input bg-card px-3 text-base focus-visible:border-primary focus-visible:outline-none";

export function SyncConfig({
  tournamentId,
  provider,
  competition,
  enabled,
  lastSync,
}: {
  tournamentId: string;
  provider: string | null;
  competition: string | null;
  enabled: boolean;
  lastSync: { status: string; message: string | null; finished_at: string | null } | null;
}) {
  const [cfgState, cfgAction] = useFormState(updateSyncConfigAction, initial);
  const [syncState, syncAction] = useFormState(syncNowAction, initial);

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card">
      <p className="text-sm text-muted-foreground">
        Trae el calendario y los resultados automáticamente desde una API de
        fútbol. <strong>openfootball</strong> es gratis y no necesita clave;
        <strong> football-data.org</strong> da resultados más en vivo con una
        clave gratuita.
      </p>

      <form action={cfgAction} className="space-y-3">
        <input type="hidden" name="tournamentId" value={tournamentId} />
        <div>
          <Label htmlFor="provider">Proveedor de datos</Label>
          <select id="provider" name="provider" defaultValue={provider ?? "none"} className={selectCls}>
            <option value="none">Manual (sin API)</option>
            {PROVIDER_OPTIONS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="competition">Código de competición</Label>
          <Input
            id="competition"
            name="competition"
            defaultValue={competition ?? ""}
            placeholder="openfootball: 2026 · football-data: WC"
          />
        </div>
        <label className="flex items-center gap-3 rounded-xl bg-secondary p-3">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={enabled}
            className="size-5 accent-pitch"
          />
          <span className="text-sm font-medium">
            Sincronización automática
            <span className="block text-xs font-normal text-muted-foreground">
              Cada hora, sin que tengas que hacer nada
            </span>
          </span>
        </label>
        {cfgState.message && (
          <Alert variant={cfgState.ok ? "success" : "error"}>
            {cfgState.ok ? "Configuración guardada ✓" : cfgState.message}
          </Alert>
        )}
        <SubmitButton variant="outline">Guardar configuración</SubmitButton>
      </form>

      <div className="border-t border-border pt-4">
        <form action={syncAction}>
          <input type="hidden" name="tournamentId" value={tournamentId} />
          <SubmitButton className="w-full">
            <RefreshCw />
            Sincronizar ahora
          </SubmitButton>
        </form>
        {syncState.message && (
          <Alert variant={syncState.ok ? "success" : "error"} className="mt-2">
            {syncState.message}
          </Alert>
        )}
        {lastSync && !syncState.message && (
          <p className="mt-2 text-xs text-muted-foreground">
            Última sincronización: {lastSync.status === "success" ? "✓" : "✗"}{" "}
            {lastSync.message}
          </p>
        )}
      </div>
    </div>
  );
}
