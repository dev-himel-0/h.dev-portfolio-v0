import type { Metadata } from "next";
import localFont from "next/font/local";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SmoothScroll } from "@/components/ui/smooth-scroll";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { PageTransition } from "@/components/ui/page-transition";
import { WipeCurtain } from "@/components/ui/wipe-curtain";
import { CircleCursor } from "@/components/ui/circle-cursor";
import { MotionProvider } from "@/components/ui/motion-provider";

const generalSans = localFont({
  src: [
    { path: "../fonts/GeneralSans-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/GeneralSans-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/GeneralSans-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/GeneralSans-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-heading",
  display: "swap",
});

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Himel — Frontend Engineer",
  description:
    "Himel is a frontend engineer with 4+ years of experience, open for freelance projects and remote roles.",
  icons: {
    icon: "/img/h.png",
  },
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
        montserrat.variable,
        generalSans.variable,
        "font-sans"
      )}
    >
      <body className="min-h-full flex flex-col">
        <SmoothScroll>
          <MotionProvider>
            <PageTransition>
              {children}
              <ScrollToTop />
            </PageTransition>
            <WipeCurtain />
          </MotionProvider>
        </SmoothScroll>
        <CircleCursor />
      </body>
    </html>
  );
}
