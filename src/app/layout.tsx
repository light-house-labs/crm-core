import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { config } from "@/lib/config";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: config.brand.name,
  description: "White-label CRM Core",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Inject dynamic theme variables based on the active config */}
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
