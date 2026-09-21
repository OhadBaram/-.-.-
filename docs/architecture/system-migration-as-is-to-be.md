# ארכיטקטורת מיגרציה: AS-IS → TO-BE

מסמך Principal Architecture למוצר יצירת קרוסלות (CaruselAI).  
משלים את מפרט המוצר ב־`docs/creation-flow/` ומתמקד בשכבות מערכת, סיכונים, דפוסי מיגרציה ובקרת איכות.

| שדה | ערך |
|-----|-----|
| סטטוס | טיוטת ארכיטקטורה — לפני מימוש |
| עקרון על | Zero Technical Debt: אין workaround במסלול הראשי; אין תלות מתה; אין «נשלים אחר כך» בלי DEBT עם בעלים ויעד |
| דפוס מיגרציה מוביל | Strangler Fig סביב זרימת היצירה + hardening רוחבי מדורג |

---

## 1. סקירת פערי ארכיטקטורה (תמצית)

### AS-IS במשפט אחד

מונוליט

Next.js App Router

עם AI בשרת, עריכה וייצוא כמעט כולם בצד לקוח, טננטיות רדודה סביב workspace ראשון, ותלויות תשתית בחבילה שלא מחוברות לקוד.

### TO-BE במשפט אחד

אותו מונוליט מודולרי (לא מיקרו־שירותים מוקדמים), עם חוזי יצירה/תמונה/יעד אחידים, שכבת עורך מפורקת, אכיפת auth+rate-limit על נתיבי AI, observabilty אמיתי, ו־CI שמונע חוב חדש.

### פערים קריטיים

| תחום | AS-IS | TO-BE | חומרת פער |
|------|-------|-------|-----------|
| זרימת יצירה | אשף ארוך; תמונות רק בעורך; שער explanation | מסלול מהיר + תמונה בחוזה/לקוח + כניסה ישירה לעורך | גבוהה (מוצר+קוד) |
| מודולריות | God components (~1k+ LOC) | מודולי flow / editor / export / images | גבוהה |
| חוזים | Zod בשרת ≠ payload טיפוסי בלקוח | חבילת חוזים משותפת אחת | גבוהה |
| תמונות | data URL מקומי; בלי מגבלות; בלי אחסון | רכיב משותף + מגבלות; אחסון בשלב מאוחר מתוכנן | בינונית→גבוהה |
| אבטחה | generate ללא חובת session; rate limit לא מחובר | session חובה לנתיבי AI יקרים; Upstash מחובר | גבוהה |
| תצפית | console בלבד; Sentry/Pino מתים בחבילה | Sentry+לוגים מובנים או הסרת התלות | בינונית |
| איכות | אין טסטים; אין CI; `ignoreBuildErrors: true` | lint+typecheck+tests ב־CI; build נכשל על TS | גבוהה |
| טננט/שימוש | `workspaces[0]`; אי־התאמת plan; usage כפול | מקור אמת אחד ל־usage/plan; workspace מפורש | בינונית |
| תיעוד↔קוד | Google auth / Next 14 / BullMQ «קיימים» | תיעוד = קוד; תלויות מתות מוסרות או מחוברות | בינונית |

---

## 2. AS-IS — מיפוי מערכתי

### 2.1 רכיבים

```
[Browser]
  CreationWizard ──► /api/wizard-chat, /api/propose-styles
  CarouselCreator ─► /api/generate
  CarouselRenderer ► Canvas drawers | JSZip | jsPDF | SlideEditor (base64)
  CopilotWidget ───► /api/copilot, /api/transcribe

[Server - Next Route Handlers]
  ai.service (Gemini | OpenRouter)
  scraper (Jina)
  prisma + tenant-db.$extends
  next-auth (Email magic link, JWT)

[Data]
  PostgreSQL: User, Workspace, WorkspaceUser, Carousel(slidesData Json), Auth tables

[Missing despite package.json]
  Sentry, Pino, Upstash ratelimit, BullMQ/ioredis — imported nowhere in src/
```

### 2.2 חולשות ארכיטקטוניות

1. **Orchestrator שביר** — `CarouselCreator` מערבב wizard overlay, explanation gate, draft, palette.
2. **Editor god-object** — state מקומי לא מסונכרן חזרה ל־DB אחרי עריכה; ייצוא ותצוגה באותו קובץ.
3. **חוזה כפול** — `CreationWizardSubmitPayload` מול `generateCarouselSchema`.
4. **Authz לא אחיד** — middleware צר; חלק מה־API בודקים session חלקית/שגויה.
5. **Phantom infrastructure** — חבילות כבדות בלי שימוש = רעש אבטחה ותחזוקה.
6. **Build soft-fail** — `typescript.ignoreBuildErrors: true` מסתיר חוב.
7. **אין רשת בטיחות** — אפס unit/integration/e2e ואין GitHub Actions.

### 2.3 אילוצים עסקיים/טכניים (קלט פרויקט)

| אילוץ | השלכה |
|--------|--------|
| מוצר RTL עברית; IG + LinkedIn | יעד פרסום חייב להיות בחוזה, לא רק בתווית כפתור |
| Time-to-Value מהיר; תמונות אינטגרליות | מיגרציית זרימה לפני פיצול מיקרו־שירותים |
| סוכן אחד / ענף אחד; מיזוג ל־main רק באישור | Canary = feature flag או אחוז משתמשים בתוך אותו deploy |
| Serverless (Vercel-style `maxDuration`) | אין להכניס BullMQ בלי worker אמיתי; תור = שלב מאוחר או לא בכלל |
| תקציב מורכבות | Strangler בתוך המונוליט > פיצול שירותים מוקדם |

---

## 3. ארכיטקטורת היעד (TO-BE)

### 3.1 עקרונות מנחים

| עקרון | יישום |
|--------|--------|
| מודולריות | גבולות ברורים: `contracts` / `creation-flow` / `editor` / `export` / `images` / `ai` / `tenant` |
| מקור אמת יחיד | חוזה Zod משותף; מיפוי `publishTarget`; usage מחישוב אחד |
| אפס חוב במסלול הראשי | אין stub UI; אין alert כפיצ׳ר; תלות לא מחוברת = מוסרת או מחוברת באותו אפוס |
| אבטחה כברירת מחדל | כל נתיב AI דורש session; rate limit; מגבלת גודל תמונה |
| תצפית | שגיאות ל־Sentry; לוג מבני; מדדי מוצר לאירועי זרימה |
| הגירה הפיכה | כל שלב עם flag או נתיב ישן לנסיגה לזמן מוגבל, ואז מחיקה |
| בדיקות כשער | CI אדום = אין מיזוג |

### 3.2 רכיבי יעד (לוגיים, בתוך אותו deploy)

```
src/
  contracts/           # Zod + TS types משותפים ללקוח ולשרת
  lib/
    publish-target.ts  # מימדים, CTA, תוויות
    image-upload.ts    # מגבלות + הודעות
    usage.ts           # מקור אמת יחיד
    services/ai.service.ts  # הנתיב היחיד ל-LLM (copilot/transcribe עוברים דרכו)
  features/
    creation-flow/     # מסלול מהיר + מסלול מלא (אותו submit)
    editor/            # state, canvas host, slide list — בלי zip/pdf בפנים
    export/            # zip/pdf adapters
    images/            # ImagePickerControl + apply-cover helpers
  app/api/...          # דקים: parse contract → service → response
```

### 3.3 מנגנונים מרכזיים

| מנגנון | תפקיד |
|--------|--------|
| Shared contracts | מונע drift לקוח/שרת |
| Cover image apply (client stage A) | אחרי generate מדביקים תמונה לשקף לפי מדיניות |
| Object storage (stage B) | URL קצר; הסרת data URL מה־API אחרי חלון תאימות |
| Feature flag `flow.fast_path` | Canary פנימי בלי תשתיית flags חיצונית בהתחלה (env / workspace flag) |
| Rate limit middleware/helper | Upstash על generate, wizard-chat, remix, copilot |
| Strangler UI | מסלול מהיר עוטף את submit הקיים; האשף המלא נשאר מאחורי «שליטה מלאה» עד ייצוב מדדים |

### 3.4 ממשקים

| ממשק | חוזה |
|------|------|
| `POST /api/generate` | schema מורחב: `publishTarget`, `coverImageDataUrl?`, `flowVariant` |
| `ImagePickerControl` | `value` / `onChange` / `onError` / `variant` |
| `publishTarget` map | → canvas size, primary export |
| Editor session state | slides + meta; שמירה ל־DB = שלב מאוחר נפרד (לא לערבב עם UX מהיר) |
| Analytics events | רשימה סגורה מ־`docs/creation-flow/03-contracts-and-anti-debt.md` |

### 3.5 מה במפורש לא ביעד הקרוב

- מיקרו־שירותי AI נפרדים
- BullMQ / Redis queue (עד שיש worker וצורך מוכח)
- פרסום OAuth ישיר לאינסטגרם/לינקדאין
- RLS ב־Postgres (נשאר application scoping + בדיקות הרשאה)
- החלפת Email auth ב־Google בלי אפוס auth נפרד

---

## 4. תוכנית הגירה שלבית

דפוס: **Strangler Fig** על זרימת היצירה, עם **hardening מקביל** (אבטחה/CI) שלא חוסם את המסלול המהיר אך חייב להתקדם לפני חשיפה רחבה.

### טבלת שלבים

| מס' | תיאור הפעולה | תוצר סופי | ניהול חוב ומניעתו | תנאי מעבר לשלב הבא |
|-----|----------------|-----------|---------------------|---------------------|
| 0 | קיבוע מפרטי מוצר+ארכיטקטורה; תיקון תיעוד שגוי (auth=Email, לא Google) | `docs/creation-flow/*` + מסמך זה מאושרים | אין קוד מוצר; מונע מימוש על הנחות שגויות | אישור D1–D6 + אישור מסמך ארכיטקטורה |
| 1 | חיבור או הסרת תלויות מתות מינימלי; כיבוי `ignoreBuildErrors`; שלד CI (lint + `tsc`) | CI ירוק על main; build נכשל על TS | מוחק/מחבר Sentry או מסיר מה־package; אוסר חבילות «לעתיד» בלי issue | CI עובר; רשימת שגיאות TS ידועות סגורות או מחולקות לכרטיסים עם יעד |
| 2 | אכיפת session על נתיבי AI יקרים + rate limit בסיסי | generate/wizard/remix/copilot מוגנים | מממש Upstash או מסיר תלות; אין «TODO rate limit» | בדיקת חסימת אנונימי; מדד שגיאות 401/429 מוגדר |
| 3 | חבילת `contracts` משותפת + רכיב `ImagePickerControl` + הסרת AI-image alert ו־screenshots מה־UI | העלאה אחידה בעורך; אין stub גלוי | מוחק כפילות FileReader; enum stub מטופל לפי מדיניות המפרט | DoD של P1 מוצר; רגרסיית העלאה ידנית עוברת |
| 4 | הסרת explanation gate; מגירת caption/hashtags בעורך | כניסה ישירה לעורך אחרי generate | מוחק מסך שער (לא משאיר שני נתיבים) | יצירה→עורך בלי אישור ביניים; העתקת כיתוב עובדת |
| 5 | `publishTarget` + `publish-target.ts` + היררכיית CTA | חוזה יעד חי; תוויות לפי יעד | אסור תווית בלי שדה state; DEBT מימדים מתועד אם עדיין זהים | payload ישן עובד; בחירת יעד נשמרת בזרימה |
| 6 | מסלול מהיר UI (Strangler) על אותו submit | S0–S2 חיים; full path מאחורי קישור | reuse מלא של contracts; אין אשף שני | מדדי TTV ראשוניים; יצירה עם/בלי תמונה |
| 7 | החלפת תמונה מהקנבס; אנליטיקה; באנר מותג אחרי הורדה | Aha עם תמונה; אירועים אחידים | handler אחד משותף; לא אונבורדינג מותג כפול | `% with user image` עולה; אין כפילות אירועים |
| 8 | (אופציונלי) מימדים לפי יעד; אחסון אובייקטים לתמונות | סוגר DEBT מימדים/אחסון | מיגרציית data URL→URL עם תאריך הסרה | בדיקות ייצוא IG/LI; מגבלות אבטחה על upload API |

מספרי השלבים 3–7 מיושרים ל־P1–P6 במפרט המוצר; 1–2 הם **תשתית חובה** שלא הופיעה מספיק במפרט UX.

### אסטרטגיית בדיקות לפי שלב

| שלב | Unit | Integration | E2E / ידני |
|-----|------|-------------|------------|
| 1 | — | `tsc`, eslint ב־CI | — |
| 2 | helper של rate limit | קריאות API ללא session → 401 | ידני: משתמש מחובר עובר |
| 3 | ולידציית קובץ תמונה | schema ישן/חדש | העלאה/הסרה בעורך |
| 4–6 | reducer/flow state אם פוצל | generate contract | מסלול מהיר מלא עד עורך |
| 7 | — | — | מובייל: תצוגה + החלפת תמונה + הורדה |
| 8 | מיפוי מימדים | upload API authz | ייצוא בשני יעדים |

### תוכנית נסיגה (Rollback) לכל שלב

| שלב | מנגנון נסיגה | זמן חיים מקסימלי לנתיב ישן |
|-----|----------------|------------------------------|
| 1 | revert PR; CI אפשר ל־warn זמנית רק עם אישור כתוב | אין נתיב ישן — רק כלי |
| 2 | flag `ENFORCE_AI_AUTH=false` לשעה/יום; אחרי ייצוב — מחיקת ה־flag | ≤ 7 ימים |
| 3 | רכיב חדש מאחורי שימוש הדרגתי ב־SlideEditor; revert PR | ≤ 14 ימים לכפילות קוד — אסור יותר |
| 4 | `GATE_PACKAGE_SUMMARY=true` מחזיר שער | ≤ 7 ימים ואז מחיקת הקוד הישן |
| 5 | ברירת מחדל `instagram`; התעלמות מ־UI יעד | שדה נשאר אופציונלי בחוזה |
| 6 | `flow.fast_path=false` → האשף המלא כברירת מחדל | עד יציבות מדדים, ואז המהיר=ברירת מחדל וה־flag מתהפך/נמחק |
| 7 | הסתרת hit-area; נשארת העלאה מהפאנל | ≤ 14 ימים |
| 8 | חזרה למימדים זהים / data URL בלבד לפי DEBT | חלון תאימות מתועד מראש |

**כלל:** נסיגה ≠ השארת שני מסלולים לנצח. כל flag מקבל תאריך תפוגה בכרטיס DEBT.

---

## 5. סיכונים ובקרת איכות

### 5.1 מפת סיכונים

| סיכון | השפעה | מניעה |
|--------|--------|--------|
| השבתת יצירה אחרי שינוי generate | גבוהה | חוזה תאימות לאחור; flag; בדיקת smoke אחרי deploy |
| עלות AI / ניצול אנונימי | גבוהה | שלב 2 לפני הרחבת חשיפה |
| Body ענק מ־data URL | בינונית | `maxBytes`; דחיית אחסון לשלב 8 |
| זליגת טוקנים ב־offboard / check-config | בינונית | צמצום payload; הגבלת check-config לסביבת dev/admin |
| רגרסיית מובייל בלי תצוגה מקדימה | גבוהה | מיזוג PR מובייל לפני שלב 7 |
| פגיעת ביצועי Canvas עם תמונות גדולות | בינונית | דגימה/דחיסה בצד לקוח לפני ציור |
| Drift תיעוד | נמוכה־בינונית | PR לתיעוד יחד עם שינוי התנהגות |

### 5.2 מדיניות קוד (אכיפה)

1. אין `alert` לפיצ׳ר מוצר.
2. אין מחרוזת «בקרוב» במסלול ראשי.
3. אין import מ־`CarouselRenderer` לטיפוסי domain — טיפוסים ב־`contracts` / `types`.
4. כל נתיב API חדש: Zod + authz + (אם AI) rate limit.
5. תלות חדשה ב־`package.json` רק עם שימוש ב־`src/` באותו PR.
6. `ignoreBuildErrors` לא חוזר ל־`true`.

### 5.3 תיעוד

- שינוי זרימה → עדכון `docs/creation-flow/`.
- שינוי ארכיטקטורה/DEBT → עדכון מסמך זה + טבלת DEBT.
- README משקף auth ו־stack אמיתיים.

### 5.4 כיסוי בדיקות יעד (מדורג)

| שכבה | יעד ראשוני | יעד אחרי שלב 6 |
|------|-------------|------------------|
| Unit | ולידציות + publish-target + image limits | + flow state helpers |
| Integration | auth על generate; schema | + cover apply |
| E2E | 1 happy path יצירה→עורך | + תמונה + הורדה |
| CI | חובה מ־שלב 1 | + e2e smoke בלילה/על PR |

---

## 6. מדדי בקרה (KPIs) להצלחת המיגרציה

### מוצר / משפך

| KPI | הגדרה | כיוון הצלחה |
|-----|--------|-------------|
| Time to first download | חציון מ־`/create` עד הורדה | ירידה |
| Create→Editor rate | generate מוצלח / התחלת יצירה | עלייה |
| % carousels with user image | לפני הורדה | עלייה |
| Fast path adoption | `flowVariant=fast` מתוך כל היצירות | יציבות > סף שנקבע אחרי canary |
| Stub CTA clicks | לחיצות «בקרוב»/alert | → 0 |

### הנדסה / יציבות

| KPI | הגדרה | כיוון הצלחה |
|-----|--------|-------------|
| CI pass rate | אחוז ירוק על main | גבוה ויציב |
| Typecheck gate | build נכשל על TS | דולק תמיד |
| AI 401/429 correctness | אנונימי נחסם; לגיטימי עובר | 100% לפי חוזה |
| Error rate (Sentry) בנתיבי create/generate | אחרי כל שלב | לא עולה מול baseline |
| Dead dependency count | חבילות ב־package בלי שימוש ב־src | יורד ל־0 או למוצדקות מתועדות |
| Open DEBT without owner/date | ספירה | = 0 למיזוג |

### תפעול

| KPI | הגדרה | כיוון הצלחה |
|-----|--------|-------------|
| Rollback events / שלב | כמה פעמים הופעל flag נסיגה | נמוך; אם חוזר — עוצרים הרחבה |
| Flag age | ימי חיים של flag מיגרציה | < תאריך התפוגה |

---

## 7. קישור למפרט המוצר

| נושא מוצר | שלב ארכיטקטורה |
|-----------|----------------|
| P0 מסמכים | שלב 0 |
| P1 ImagePicker | שלב 3 |
| P2 הסרת שער חבילה | שלב 4 |
| P3 publishTarget | שלב 5 |
| P4 מסלול מהיר | שלב 6 |
| P5–P6 קנבס + אנליטיקה | שלב 7 |
| P7–P8 מימדים/אחסון | שלב 8 |
| (חסר במפרט UX) CI/Auth/Rate limit | שלבים 1–2 — חובה לפני canary רחב |

---

## 8. המלצת ביצוע מיידית (ארכיטקט)

1. לאשר מסמך זה + החלטות המוצר.  
2. למזג מסמכים ל־main (באישור) בלי קוד מוצר.  
3. להתחיל **שלב 1+2** (CI/TS + authz) במקביל להכנות ל־שלב 3 — hardening לא מחכה ל־UI.  
4. רק אחר כך Strangler של המסלול המהיר (שלבים 4–6).  
5. כל PR = ענף אחד, DoD מלא, בלי stubs.
