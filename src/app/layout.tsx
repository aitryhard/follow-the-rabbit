import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Follow the Rabbit",
  description:
    "Everything eventually leads to Rabbit. An interactive journey through the web of knowledge.",
  openGraph: {
    title: "Follow the Rabbit",
    description:
      "Everything eventually leads to Rabbit. An interactive journey through the web of knowledge.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#141210] text-[#e8e4dd]">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/5 via-transparent to-transparent pointer-events-none" />
        {children}
      </body>
    </html>
  );
}
