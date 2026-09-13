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
    "PRISM helps you understand your health-insurance policy, ask grounded questions, organize documents, and prepare for claims.",
  openGraph: {
    title: "PRISM — AI Insurance Companion",
    description:
      "PRISM helps you understand your health-insurance policy, ask grounded questions, organize documents, and prepare for claims.",
    type: "website",
    siteName: "PRISM",
  },
  twitter: {
    card: "summary_large_image",
    title: "PRISM — AI Insurance Companion",
    description:
      "PRISM helps you understand your health-insurance policy, ask grounded questions, organize documents, and prepare for claims.",
  },
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
