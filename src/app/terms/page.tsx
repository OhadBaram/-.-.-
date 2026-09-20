import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm text-gray-800">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">תנאי שימוש</h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <p>תאריך עדכון אחרון: {new Date().toLocaleDateString('he-IL')}</p>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">1. הסכמה לתנאים</h2>
            <p>
              ברוכים הבאים ל-<strong>קרוסל. איי. אי</strong>. בעצם השימוש באתר ובמערכת (להלן: "השירות"), אתה מסכים להיות מחויב לתנאי השימוש המפורטים במסמך זה. אם אינך מסכים לאחד מהתנאים, אנא הימנע משימוש בשירות.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">2. השימוש בשירות</h2>
            <p>
              השירות מאפשר יצירת קרוסלות ותוכן ויזואלי לרשתות חברתיות המבוסס על בינה מלאכותית. השימוש מיועד למטרות חוקיות בלבד. חל איסור מוחלט להשתמש בשירות ליצירת תוכן פוגעני, מסית, מפר זכויות יוצרים או בניגוד לכל חוק.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">3. חשבון משתמש</h2>
            <p>
              המשתמש אחראי באופן בלעדי על שמירת סודיות פרטי הגישה לחשבונו ועל כל פעולה שתתבצע תחת החשבון. יש לדווח לנו מידית על כל שימוש לא מורשה בחשבונך.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">4. קניין רוחני</h2>
            <p>
              כל הזכויות הקנייניות במערכת עצמה, לרבות קוד, עיצוב, לוגו וממשק משתמש, שייכות ל-<strong>קרוסל. איי. אי</strong> ולבינה לתעשייה.
              עם זאת, הזכויות בתוכן שאתה יוצר באמצעות המערכת שייכות לך, בכפוף לכך שהתוכן אינו מפר זכויות של צד שלישי.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">5. הגבלת אחריות</h2>
            <p>
              השירות ניתן כמות שהוא ("AS IS"). החברה אינה מתחייבת שהשירות יהיה חסין מפני תקלות או הפרעות. בשום מקרה החברה לא תהיה אחראית לנזק ישיר, עקיף או תוצאתי שייגרם כתוצאה מהשימוש או מאי-היכולת להשתמש בשירות. התוכן המיוצר מבוסס על בינה מלאכותית, ועל המשתמש לבדוק ולאמת אותו בטרם פרסומו.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">6. שינויים בשירות ובתנאים</h2>
            <p>
              החברה רשאית לעדכן, לשנות או להפסיק את השירות, כולו או חלקו, בכל עת וללא הודעה מוקדמת. כמו כן, אנו רשאים לעדכן תנאים אלו מעת לעת. המשך השימוש לאחר שינוי מהווה הסכמה לתנאים המעודכנים.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">7. סמכות שיפוט</h2>
            <p>
              על תנאים אלו יחולו דיני מדינת ישראל בלבד. כל סכסוך משפטי יידון בבתי המשפט המוסמכים במחוז תל אביב-יפו.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
