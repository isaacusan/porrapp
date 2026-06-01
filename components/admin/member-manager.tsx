"use client";

import { useState } from "react";
import {
  setMemberStatusAction,
  transferAdminAction,
} from "@/lib/admin/actions";
import { Avatar } from "@/components/brand/avatar";
import { Button } from "@/components/ui/button";
import { Crown, Ban, RotateCcw, ShieldCheck } from "lucide-react";

type Member = {
  user_id: string;
  display_name: string;
  avatar_id: string | null;
  role: "admin" | "participant";
  status: "active" | "banned" | "left";
};

function TransferConfirm({
  tournamentId,
  member,
}: {
  tournamentId: string;
  member: Member;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        <Crown />
        Hacer admin
      </Button>
    );
  }
  return (
    <form action={transferAdminAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <input type="hidden" name="targetUserId" value={member.user_id} />
      <p className="text-right text-xs text-muted-foreground">
        Pasarás a ser jugador. ¿Seguro?
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Cancelar
        </Button>
        <Button type="submit" variant="gold" size="sm">
          Sí, traspasar
        </Button>
      </div>
    </form>
  );
}

export function MemberManager({
  tournamentId,
  members,
}: {
  tournamentId: string;
  members: Member[];
}) {
  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card shadow-card">
      {members.map((m) => (
        <div key={m.user_id} className="flex flex-wrap items-center gap-3 p-3">
          <Avatar id={m.avatar_id} size="sm" />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">{m.display_name}</span>
              {m.role === "admin" && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold-foreground">
                  <ShieldCheck className="size-3" />
                  Admin
                </span>
              )}
              {m.status === "banned" && (
                <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                  Baneado
                </span>
              )}
            </div>
          </div>

          {m.role !== "admin" && (
            <div className="flex items-center gap-2">
              {m.status === "banned" ? (
                <form action={setMemberStatusAction}>
                  <input type="hidden" name="tournamentId" value={tournamentId} />
                  <input type="hidden" name="targetUserId" value={m.user_id} />
                  <input type="hidden" name="status" value="active" />
                  <Button type="submit" variant="outline" size="sm">
                    <RotateCcw />
                    Readmitir
                  </Button>
                </form>
              ) : (
                <>
                  <TransferConfirm tournamentId={tournamentId} member={m} />
                  <form action={setMemberStatusAction}>
                    <input type="hidden" name="tournamentId" value={tournamentId} />
                    <input type="hidden" name="targetUserId" value={m.user_id} />
                    <input type="hidden" name="status" value="banned" />
                    <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                      <Ban />
                      Banear
                    </Button>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
