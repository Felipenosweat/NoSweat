import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nosweatfd.com"),
  title: {
    default: "No Sweat · Your website, no sweat.",
    template: "%s · No Sweat",
  },
  description:
    "Describe your business and get a beautiful, ready-to-publish website in minutes. Built for small businesses.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen bg-white font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
