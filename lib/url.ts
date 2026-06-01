import { headers } from "next/headers";

/** Absolute base URL of the app, for building share links and email redirects. */
export function getBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}
