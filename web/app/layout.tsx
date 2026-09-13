import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PRISM — AI Insurance Companion",
  description:
    "Understand your health insurance before you need it, and be better prepared when you need to use it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#F6F8FB] text-[#111827] dark:bg-[#0B1220] dark:text-[#F6F8FB]">
        {children}
      </body>
    </html>
  );
}
