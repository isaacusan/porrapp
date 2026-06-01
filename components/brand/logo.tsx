import { cn } from "@/lib/utils";
import { SoccerBall } from "./soccer-ball";

const sizes = {
  sm: { text: "text-2xl", ball: "size-5", gap: "gap-0.5" },
  md: { text: "text-4xl", ball: "size-7", gap: "gap-1" },
  lg: { text: "text-6xl", ball: "size-11", gap: "gap-1.5" },
} as const;

interface LogoProps {
  size?: keyof typeof sizes;
  /** "dark" for light backgrounds, "light" for the green stadium backdrop. */
  tone?: "dark" | "light";
  className?: string;
}

/**
 * The PORRAPP wordmark. The middle "A" is replaced by a spinning-ready
 * soccer ball, giving the brand a scoreboard / matchday feel.
 */
export function Logo({ size = "md", tone = "dark", className }: LogoProps) {
  const s = sizes[size];
  const ink = tone === "light" ? "text-pitch-foreground" : "text-foreground";
  const ballColor = tone === "light" ? "text-lime" : "text-pitch";

  return (
    <span
      className={cn(
        "inline-flex select-none items-center font-display tracking-tight",
        s.text,
        s.gap,
        ink,
        className,
      )}
    >
      <span>PORR</span>
      <SoccerBall className={cn(s.ball, ballColor, "-mx-0.5")} />
      <span>PP</span>
    </span>
  );
}
