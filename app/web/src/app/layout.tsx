import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyTravel — AI-Powered Travel Planning",
  description:
    "Generate personalised, day-by-day travel itineraries in seconds with MyTravel AI. Smart sequencing, weather-aware planning, and fully editable plans.",
  keywords: [
    "AI travel planner",
    "itinerary generator",
    "travel planning",
    "MyTravel AI",
    "personalised travel",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MyTravel",
  },
  openGraph: {
    title: "MyTravel — AI-Powered Travel Planning",
    description:
      "Generate personalised, day-by-day travel itineraries in seconds with MyTravel AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
