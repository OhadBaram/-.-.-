import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

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
            © {new Date().getFullYear()} קרוסל. איי. אי מבית בינה לתעשייה. כל הזכויות שמורות.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
