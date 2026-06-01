import { Avatar } from "@/components/brand/avatar";
import { RoleBadge } from "./badges";

export type Member = {
  user_id: string;
  display_name: string;
  avatar_id: string | null;
  role: "admin" | "participant";
};

export function MemberRoster({ members }: { members: Member[] }) {
  return (
    <ul className="divide-y divide-border">
      {members.map((m) => (
        <li key={m.user_id} className="flex items-center gap-3 py-3">
          <Avatar id={m.avatar_id} size="md" />
          <span className="flex-1 truncate font-semibold">{m.display_name}</span>
          {m.role === "admin" && <RoleBadge role="admin" />}
        </li>
      ))}
    </ul>
  );
}
