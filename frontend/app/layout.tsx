import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Video Streaming App",
  description: "Upload and stream videos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Remove cz-shortcut-listen attribute
              document.addEventListener('DOMContentLoaded', () => {
                const body = document.body;
                if (body.hasAttribute('cz-shortcut-listen')) {
                  body.removeAttribute('cz-shortcut-listen');
                }
              });
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
