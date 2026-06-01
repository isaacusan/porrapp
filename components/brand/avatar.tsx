"use client";

import { cn } from "@/lib/utils";
import { AVATARS, getAvatar } from "@/lib/avatars";

const sizeMap = {
  sm: "size-8 text-base",
  md: "size-11 text-xl",
  lg: "size-16 text-3xl",
} as const;

export function Avatar({
  id,
  size = "md",
  className,
}: {
  id: string | null | undefined;
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  const a = getAvatar(id);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        sizeMap[size],
        a.bg,
        className,
      )}
      aria-hidden="true"
    >
      {a.emoji}
    </span>
  );
}

/** Grid of selectable avatars. Controlled via a hidden input named `avatar_id`. */
export function AvatarPicker({
  name = "avatar_id",
  value,
  onChange,
}: {
  name?: string;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-6 gap-2">
        {AVATARS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onChange(a.id)}
            aria-label={`Elegir avatar ${a.emoji}`}
            aria-pressed={value === a.id}
            className={cn(
              "flex aspect-square items-center justify-center rounded-full text-xl transition-transform",
              a.bg,
              value === a.id
                ? "ring-2 ring-foreground ring-offset-2 ring-offset-card scale-105"
                : "opacity-70 hover:opacity-100 hover:scale-105",
            )}
          >
            {a.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
