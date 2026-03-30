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
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
