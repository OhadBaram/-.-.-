# צ׳ק־ליסט מוכנות פרודקשן — יסודות + מסלול מהיר

ענף:

`feat/creation-flow-foundation`

## Definition of Done

- [x] אין TODO / stub / alert לפיצ׳ר מת במסלול הראשי
- [x] חוזה generate משותף למסלול מהיר ומלא
- [x] session חובה + rate limit על נתיבי AI
- [x] העלאת תמונה דרך רכיב אחד עם ולידציה
- [x] כניסה ישירה לעורך אחרי יצירה
- [x] CTA ייצוא לפי `publishTarget`
- [x] unit tests עוברים
- [x] `tsc --noEmit` עובר
- [x] CI workflow קיים

## פקודות אימות

```bash
npm ci --legacy-peer-deps
npx prisma generate
npm test
npm run typecheck
npx eslint src/lib/contracts src/lib/api src/lib/creation-flow src/lib/validations.ts \
  src/components/ImagePickerControl.tsx src/components/FastPathWizard.tsx \
  src/components/SlideEditor.tsx src/components/CarouselCreator.tsx \
  src/components/WizardSummaryBar.tsx
```

## משתני סביבה נדרשים

| משתנה | תפקיד |
|--------|--------|
| `DATABASE_URL` | Postgres |
| `NEXTAUTH_SECRET` | JWT |
| `NEXTAUTH_URL` | URL ציבורי |
| `EMAIL_FROM` + Resend/SMTP | Magic link |
| `GEMINI_API_KEY` ו/או `OPENROUTER_API_KEY` | AI |
| `DEFAULT_AI_PROVIDER` / `DEFAULT_AI_MODEL` | ברירות מחדל |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | אופציונלי — rate limit מבוזר; בלעדיהם משתמשים במאגר זיכרון |

## בדיקות ידניות (smoke)

1. התחברות → `/dashboard/create` → מסלול מהיר (יעד → נושא → תמונה/דילוג)
2. יצירה → עורך בלי מסך «החבילה מוכנה»
3. כיתוב/האשטאגים/הסבר במגירה בראש העורך
4. העלאת תמונה מהתצוגה + מה־SlideEditor
5. שינוי יעד משנה תוויות הורדה
6. «שליטה מלאה» → אשף קיים עדיין יוצר
7. בקשת generate בלי session → 401

## פריסה

Deploy רגיל ל־Vercel מהענף אחרי אישור מיזוג ל־main (רק באישור מפורש).
אחרי deploy: smoke על `/dashboard/create` ו־`/api/generate` עם משתמש מחובר.
