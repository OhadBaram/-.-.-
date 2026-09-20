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
    <html lang="he" dir="rtl">
      <body className="antialiased min-h-screen flex flex-col">
        <Providers>
          <div className="flex-grow">{children}</div>
          <footer className="w-full py-6 text-center text-sm text-gray-500 bg-gray-50 border-t border-gray-200">
            <div className="mb-2">© {new Date().getFullYear()} קרוסל. איי. אי מבית בינה לתעשייה. כל הזכויות שמורות.</div>
            <div className="flex justify-center gap-4">
              <a href="/privacy" className="hover:underline">מדיניות פרטיות</a>
              <a href="/terms" className="hover:underline">תנאי שימוש</a>
            </div>
          </footer>
        </Providers>
        <CookieBanner />
        <Script 
          src="https://cdn.userway.org/widget.js" 
          data-account="PLACEHOLDER" 
          data-position="6"
          strategy="lazyOnload" 
        />
      </body>
    </html>
  );
}
