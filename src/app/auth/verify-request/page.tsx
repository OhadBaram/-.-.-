export default function VerifyRequest() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans" dir="rtl">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded-full mx-auto mb-6 text-3xl">
          ✉️
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-4">
          בדוק את תיבת המייל שלך
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          שלחנו לך כעת קישור קסם מאובטח כדי להתחבר ללוח הבקרה.
        </p>
        <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 rounded-lg mb-6 text-right">
          <p className="text-yellow-800 font-bold">
            💡 שים לב: 
            אם אינך מוצא את המייל תוך דקה, אנא בדוק בתיקיית דואר זבל (Spam) או בתיקיית קידומי מכירות.
          </p>
        </div>
        <p className="text-sm text-gray-500">
          אתה יכול לסגור חלון זה לאחר הלחיצה על הקישור במייל.
        </p>
      </div>
    </div>
  );
}
