"use client";

import { useEffect, useState } from "react";

/**
 * Renders an ISO timestamp in the visitor's own locale and timezone.
 * Server-rendered text would be in the server's timezone, so we format on the
 * client after mount. Falls back to a simple date during SSR/first paint.
 */
export function LocalDateTime({
  iso,
  className,
}: {
  iso: string;
  className?: string;
}) {
  const [text, setText] = useState<string>(() =>
    new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
    }).format(new Date(iso)),
  );

  useEffect(() => {
    setText(
      new Intl.DateTimeFormat("es-ES", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso)),
    );
  }, [iso]);

  return (
    <time dateTime={iso} className={className}>
      {text}
    </time>
  );
}
