import type { Metadata } from "next";
import { DM_Sans, Figtree } from "next/font/google";
import "./globals.css";

/** Display / headings — matches clickrmedia.com hero (Figtree 800). */
const display = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

/** Body / CTA — matches clickrmedia.com UI (DM Sans). */
const sans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Clickr",
    template: "%s · Clickr",
  },
  description:
    "Clickr — media that moves brands forward. Explore the company timeline from 2009 to today.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
