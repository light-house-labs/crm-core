import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { config } from "@/lib/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${config.brand.name} · CRM Platform`,
  description: "Professional white-label CRM platform for service businesses.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
            :root {
              --primary-color: ${config.brand.primaryColor};
              --accent-color: ${config.brand.accentColor};
            }
          `,
          }}
        />
        <link rel="icon" href={config.brand.faviconUrl} />
      </head>
      <body className="font-[var(--font-inter)]" suppressHydrationWarning>{children}</body>
    </html>
  );
}

