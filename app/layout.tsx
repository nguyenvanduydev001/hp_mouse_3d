import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "HP Gaming Mouse - Scrollytelling",
  description: "Experience the HP Gaming Mouse in 3D through innovative scrollytelling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased selection:bg-neutral-800 selection:text-white`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
