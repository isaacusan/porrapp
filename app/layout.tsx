import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted fonts (no build-time call to Google, faster + privacy-friendly).
const display = localFont({
  src: "./fonts/anton-400.woff2",
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const body = localFont({
  src: "./fonts/outfit-variable.woff2",
  weight: "100 900",
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PORRAPP — La porra del Mundial entre amigos",
  description:
    "Crea tu torneo privado, predice los marcadores, gana powerups y corona al profeta del gol. Solo para amigos.",
  applicationName: "PORRAPP",
};

export const viewport: Viewport = {
  themeColor: "#0a7d3f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
