import type { Metadata } from "next";
import "./globals.css";
import "./nagarro-theme.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "MonetizeMate — AI-Powered API Monetization",
  description: "Leverage AI to develop personalized monetization strategies",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
