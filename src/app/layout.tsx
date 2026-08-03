import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SmoothScroll } from "@/components/ui/smooth-scroll";

const outfitHeading = Outfit({ subsets: ["latin"], variable: "--font-heading" });

const generalSans = localFont({
  src: [
    { path: "../fonts/GeneralSans-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/GeneralSans-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/GeneralSans-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/GeneralSans-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-general",
  display: "swap",
});

const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Himel — Frontend Engineer",
  description:
    "Himel is a frontend engineer with 4+ years of experience, open for freelance projects and remote roles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        outfitHeading.variable,
        generalSans.variable,
        "font-sans"
      )}
    >
      <body className="min-h-full flex flex-col">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
