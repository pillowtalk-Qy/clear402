import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Clear402 Foundation",
  description: "Foundation dashboard for the Clear402 monorepo."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
