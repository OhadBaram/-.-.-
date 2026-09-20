"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "true");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-800" dir="rtl">
      <div className="flex-1 text-center sm:text-right">
        אנו משתמשים בקובצי עוגיות (Cookies) כדי לשפר את חווית השימוש באתר, לנתח את התנועה בו ולהתאים אישית תוכן. בהמשך הגלישה באתר, הנך מסכים/ה לשימוש שלנו בקובצי עוגיות. למידע נוסף, קרא/י את 
        {" "}
        <Link href="/privacy" className="text-blue-600 hover:underline">
          מדיניות הפרטיות
        </Link>
        {" "}
        שלנו.
      </div>
      <button 
        onClick={acceptCookies}
        className="px-8 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition font-medium whitespace-nowrap"
      >
        אישור
      </button>
    </div>
  );
}
