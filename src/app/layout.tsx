import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Providers from "@/components/Providers";
import CookieBanner from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: "קרוסל. איי. אי",
  description: "קרוסל. איי. אי - מחולל הקרוסלות המוביל לאינסטגרם, ליצירת קרוסלות לאינסטגרם",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Providers>
          <div className="flex-grow">{children}</div>
          <footer className="w-full py-6 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
            <div className="mb-2">© {new Date().getFullYear()} קרוסל. איי. אי מבית בינה לתעשייה. כל הזכויות שמורות.</div>
            <div className="flex justify-center gap-4">
              <a href="/privacy" className="hover:underline">מדיניות פרטיות</a>
              <a href="/terms" className="hover:underline">תנאי שימוש</a>
            </div>
          </footer>
        </Providers>
        <CookieBanner />
        {process.env.NEXT_PUBLIC_USERWAY_ACCOUNT_ID ? (
          <Script
            src="https://cdn.userway.org/widget.js"
            data-account={process.env.NEXT_PUBLIC_USERWAY_ACCOUNT_ID}
            data-position="6"
            strategy="lazyOnload"
          />
        ) : null}
      </body>
    </html>
  );
}
