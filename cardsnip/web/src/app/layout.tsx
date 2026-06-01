import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CardSnip",
  description: "Dashboard local de surveillance TCG sealed.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
