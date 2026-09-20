import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm text-gray-800">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">מדיניות פרטיות</h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <p>תאריך עדכון אחרון: {new Date().toLocaleDateString('he-IL')}</p>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">1. מבוא</h2>
            <p>
              אנו ב-<strong>קרוסל. איי. אי</strong> (להלן: "החברה" או "אנו") מכבדים את פרטיות המשתמשים שלנו. מדיניות זו מסבירה כיצד אנו אוספים, משתמשים ושומרים על המידע האישי שלך בעת השימוש במערכת שלנו.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">2. איסוף מידע</h2>
            <p>
              אנו אוספים מידע שאתה מספק לנו באופן ישיר, כגון בעת יצירת חשבון (שם, כתובת דוא"ל), וכן מידע טכני הנאסף באופן אוטומטי בעת השימוש באתר (כגון כתובת IP, סוג דפדפן, נתוני שימוש וקובצי עוגיות).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">3. שימוש במידע</h2>
            <p>
              המידע שאנו אוספים משמש לצורך:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 pr-4">
              <li>אספקה ותפעול של השירותים שלנו (יצירת קרוסלות).</li>
              <li>שיפור והתאמה אישית של חווית המשתמש.</li>
              <li>יצירת קשר עם המשתמשים למתן תמיכה או שליחת עדכונים.</li>
              <li>אבטחת המערכת ומניעת הונאות.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">4. שיתוף מידע עם צדדים שלישיים</h2>
            <p>
              איננו מוכרים או משכירים את המידע האישי שלך לצדדים שלישיים. אנו עשויים לשתף מידע עם ספקי שירות חיצוניים (כגון שירותי ענן או ספקי בינה מלאכותית) אך ורק לצורך תפעול השירות, ותחת התחייבות לשמירה על סודיות.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">5. אבטחת מידע</h2>
            <p>
              אנו מיישמים אמצעי אבטחה טכנולוגיים וארגוניים מתקדמים כדי להגן על המידע שלך. עם זאת, אין מערכת חסינה לחלוטין ואיננו יכולים להבטיח אבטחה מוחלטת של המידע.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">6. זכויות המשתמש</h2>
            <p>
              זכותך לעיין במידע האישי שלך, לבקש לתקן אותו או למחוק אותו. למימוש זכויות אלו, אנא פנה אלינו באמצעות פרטי הקשר המופיעים מטה.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">7. קובצי עוגיות (Cookies)</h2>
            <p>
              האתר משתמש בקובצי עוגיות לצורך תפעול שוטף, אבטחת מידע ושיפור חווית המשתמש. באפשרותך לשנות את הגדרות הדפדפן שלך כדי לחסום עוגיות, אך הדבר עשוי לפגוע בתפקוד האתר.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">8. שינויים במדיניות</h2>
            <p>
              אנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו באתר וייכנסו לתוקף מיד עם פרסומם.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
