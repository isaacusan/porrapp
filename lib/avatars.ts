/** Preloaded avatars users pick per tournament. Stored as avatar_id (e.g. "avatar-03"). */
export type Avatar = {
  id: string;
  emoji: string;
  /** Tailwind background class for the avatar circle. */
  bg: string;
};

export const AVATARS: Avatar[] = [
  { id: "avatar-01", emoji: "⚽", bg: "bg-pitch text-pitch-foreground" },
  { id: "avatar-02", emoji: "🏆", bg: "bg-gold text-gold-foreground" },
  { id: "avatar-03", emoji: "🔥", bg: "bg-coral text-coral-foreground" },
  { id: "avatar-04", emoji: "🧤", bg: "bg-lime text-lime-foreground" },
  { id: "avatar-05", emoji: "🥅", bg: "bg-pitch-dark text-pitch-foreground" },
  { id: "avatar-06", emoji: "⭐", bg: "bg-gold text-gold-foreground" },
  { id: "avatar-07", emoji: "🎯", bg: "bg-coral text-coral-foreground" },
  { id: "avatar-08", emoji: "👑", bg: "bg-gold text-gold-foreground" },
  { id: "avatar-09", emoji: "🦁", bg: "bg-lime text-lime-foreground" },
  { id: "avatar-10", emoji: "🐂", bg: "bg-pitch text-pitch-foreground" },
  { id: "avatar-11", emoji: "🦅", bg: "bg-pitch-dark text-pitch-foreground" },
  { id: "avatar-12", emoji: "🐉", bg: "bg-coral text-coral-foreground" },
];

const byId = new Map(AVATARS.map((a) => [a.id, a]));

export function getAvatar(id: string | null | undefined): Avatar {
  return (id && byId.get(id)) || AVATARS[0];
}
