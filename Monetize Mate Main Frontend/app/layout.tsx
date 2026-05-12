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
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{
        background: 'linear-gradient(135deg, #060E1E 0%, #0A1628 40%, #0D2035 70%, #071420 100%)',
        minHeight: '100vh',
        color: '#fff',
      }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}