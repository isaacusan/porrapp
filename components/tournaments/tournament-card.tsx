import Link from "next/link";
import { Card } from "@/components/ui/card";
import { RoleBadge, StatusBadge } from "./badges";
import { Users, ChevronRight } from "lucide-react";

export type TournamentSummary = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  role: "admin" | "participant";
  member_count: number;
};

export function TournamentCard({ t }: { t: TournamentSummary }) {
  return (
    <Link href={`/t/${t.id}`} className="block">
      <Card className="group flex items-center gap-4 p-4 transition-transform hover:-translate-y-0.5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-pitch/10 text-2xl">
          🏆
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-xl">{t.name}</h3>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <RoleBadge role={t.role} />
            <StatusBadge status={t.status} />
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {t.member_count}
            </span>
          </div>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Card>
    </Link>
  );
}
