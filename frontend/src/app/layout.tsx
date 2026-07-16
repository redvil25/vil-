import type { Metadata } from "next";
import "../styles/globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: "Mindful AI Sandbox",
    template: "%s | Mindful AI Sandbox",
  },
  description:
    "A full-stack web application sandbox for the Mindful AI Coding course.",
  keywords: [
    "web development",
    "full-stack",
    "AWS",
    "serverless",
    "sandbox",
    "learning",
  ],
  authors: [{ name: "Mindful AI" }],
  creator: "Mindful AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    title: "Mindful AI Sandbox",
    description:
      "A full-stack web application sandbox for the Mindful AI Coding course.",
    siteName: "Mindful AI Sandbox",
  },
  twitter: {
    card: "summary",
    title: "Mindful AI Sandbox",
    description:
      "A full-stack web application sandbox for the Mindful AI Coding course.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/graphics/favicon.ico" />
      </head>
      <body>
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <QueryProvider>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
