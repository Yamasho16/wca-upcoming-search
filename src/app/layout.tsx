import type { Metadata } from "next";

import { env } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  title: env.appName,
  description: "Search upcoming WCA competitions by country, event, round count, and date range.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
