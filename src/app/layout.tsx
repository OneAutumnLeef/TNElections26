import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/shell/Nav";
import { StatusStrip } from "@/components/shell/StatusStrip";
import { Providers } from "@/components/shell/Providers";
import { VisitTrackerMount } from "@/components/shell/VisitTrackerMount";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TN26 · Tamil Nadu Elections 2026",
  description: "Live results dashboard for the 2026 Tamil Nadu Legislative Assembly elections.",
  metadataBase: new URL("https://tn26.derajyojith.dev"),
  openGraph: {
    title: "TN26 · Tamil Nadu Elections 2026",
    description: "Live results dashboard for the 2026 Tamil Nadu Legislative Assembly elections.",
    url: "https://tn26.derajyojith.dev",
    siteName: "TN26",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TN26 · Tamil Nadu Elections 2026",
    description: "Live results dashboard for the 2026 Tamil Nadu Legislative Assembly elections.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try { var t = localStorage.getItem('tn26-theme'); if (t === 'light') document.documentElement.setAttribute('data-theme','light'); } catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-dvh" suppressHydrationWarning>
        <Providers>
          <VisitTrackerMount />
          <div className="flex min-h-dvh flex-col">
            <Nav />
            <StatusStrip />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-(--border) py-6 text-center text-xs text-(--text-subtle)">
              Data sourced from Election Commission of India · Tamil Nadu CEO. For informational purposes only.
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
