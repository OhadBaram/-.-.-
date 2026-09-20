# קרוסל. איי. אי מבית בינה לתעשייה

מערכת SaaS ארגונית (Enterprise) חכמה ליצירת קרוסלות לאינסטגרם המופעלת באמצעות בינה מלאכותית, פותחה מבית "בינה לתעשייה". 

## מבט על הארכיטקטורה

המערכת פותחה בארכיטקטורת Multi-Tenant מתקדמת המבטיחה בידוד נתונים מוחלט לכל לקוח (Workspace), תוך שימוש בטכנולוגיות המובילות בשוק:

- **Frontend & Backend**: Next.js (App Router) 
- **Database**: PostgreSQL
- **ORM**: Prisma (כולל Tenant DB Extension לבידוד נתונים RLS)
- **Authentication**: NextAuth.js (Auth.js) דרך Google Provider
- **AI Integration**: Google Gemini / OpenRouter (תמיכה בניתוב מודלים גמיש)
- **Rate Limiting**: @upstash/ratelimit & Redis
- **Background Jobs**: BullMQ (לתורים)
- **Observability**: Pino Logger (מזהה Tenant בכל שגיאה)

## תכונות מרכזיות

- **יצירת תוכן מבוססת AI**: הפקת קרוסלות מלאות (טקסט ועיצוב) בשניות.
- **לוח בקרה אישי**: צפייה בהיסטוריית הקרוסלות וניהול פרופיל.
- **ספריית מותג (Brand Identity)**: שמירת זהות מותג וצבעים אישית לכל מרחב עבודה.
- **בידוד נתונים (Tenant Isolation)**: הפרדה מלאה ברמת מסד הנתונים למניעת זליגת מידע (IDOR Protection).
- **תמחור מבוסס שימוש (Billing)**: מנגנון בנק קרדיטים ומוני שימוש אינטגרליים לחבילות (Free, Pro, Agency).
- **תאימות ל-GDPR (Offboarding)**: נתיב מחיקת נתונים וייצוא מלא למשתמש שעוזב.
- **Feature Flags**: מתגי תכונות לשליטה בפיצ'רים מתקדמים פר לקוח.

## משתני סביבה

לפני הרצה, ודאו שקובץ

`.env`

מכיל ערכים כמו אלה:

```env
# PostgreSQL — must start with postgresql:// or postgres://
# Neon / Supabase / Vercel Postgres pooled URL is fine.
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secret_key"
EMAIL_FROM="קרוסל.איי.אי <noreply@yourdomain.com>"
RESEND_API_KEY="re_xxxxxxxx"
# או במקום Resend:
# EMAIL_SERVER="smtp://user:pass@smtp.example.com:587"
GEMINI_API_KEY="your_gemini_key"
OPENROUTER_API_KEY="your_openrouter_key"
UPSTASH_REDIS_REST_URL="your_upstash_url"
UPSTASH_REDIS_REST_TOKEN="your_upstash_token"
```

### חשוב ל־DATABASE_URL

האפליקציה משתמשת ב־

Prisma

עם חיבור

Postgres

רגיל.

הכתובת חייבת להתחיל ב־

`postgresql://`

או

`postgres://`

קידומות כמו

`prisma://`

או

`prisma+postgres://`

שייכות ל־

Prisma Accelerate

ודורשות הגדרה נפרדת — לאפליקציה הזו יש להשתמש ב־URL סטנדרטי (Neon / Supabase / Vercel Postgres).

ב־

Vercel

: עדכנו את המשתנה ואז

Redeploy.

לבדיקה בפרודקשן:

`GET /api/auth/check-config`

עד שמופיע

`databaseOk: true`

ו־

`ready: true`

## התקנה והרצה מקומית

1. התקנת חבילות התוכנה:
```bash
npm install
```

2. סנכרון מסד הנתונים (מול פוסטגרס):
```bash
npx prisma db push
```

3. הרצת שרת הפיתוח:
```bash
npm run dev
```
האפליקציה תהיה זמינה בכתובת `http://localhost:3000`.

## מבנה התיקיות המרכזי

- `/src/app` - ראוטר הדפים של המערכת (API, Dashboard, Pricing, Home).
- `/src/components` - רכיבי ממשק משתמש (קנבס, טפסים, חיווי טעינה).
- `/src/lib` - ספריות שירות (חיבור ל-DB, תצורת Auth, מנגנון Tenant-DB, ספריות Rate Limit ו-Logger).
- `/prisma` - סכמת מסד הנתונים (`schema.prisma`).

---
© 2026 קרוסל. איי. אי מבית בינה לתעשייה.
