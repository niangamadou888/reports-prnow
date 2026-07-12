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
  title: "PRNow Reports | Press Release Distribution Reports",
  description:
    "Secure hosting for PRNow press release distribution reports — view the full list of publications where your press release was published, with live links.",
  icons: {
    icon: "/favicon.png",
  },
  // Reports contain client-specific data, so they stay out of search indexes.
  // follow:true still lets crawlers pass equity through the outgoing PRNow link.
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
