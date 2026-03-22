# 🎬 AI Recaps Maker & Auto Post

<div align="center">

![AI Recaps Maker](https://img.shields.io/badge/Version-1.2.0-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4.11-38B2AC?style=for-the-badge&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Compatible-3ECF8E?style=for-the-badge&logo=supabase)

**הפלטפורמה המתקדמת ביותר ליצירת סיכומי וידאו מונעי AI עם Google Gemini**

[🚀 Demo](#) | [📖 Docs](#documentation) | [🐛 Report Bug](https://github.com/yaskovbs/AI-Recaps-Web-App/issues) | [✨ Request Feature](https://github.com/yaskovbs/AI-Recaps-Web-App/issues)

</div>

---

## 📋 תוכן עניינים

- [אודות הפרויקט](#-אודות-הפרויקט)
- [תכונות עיקריות](#-תכונות-עיקריות)
- [טכנולוגיות](#️-טכנולוגיות)
- [התחלה מהירה](#-התחלה-מהירה)
- [הגדרות סביבה](#️-הגדרות-סביבה)
- [פריסה ל-Production](#-פריסה-ל-production)
- [מבנה הפרויקט](#-מבנה-הפרויקט)
- [תיעוד API](#-תיעוד-api)
- [תמיכה רב-לשונית](#-תמיכה-רב-לשונית)
- [תרומה לפרויקט](#-תרומה-לפרויקט)
- [רישיון](#-רישיון)
- [יצירת קשר](#-יצירת-קשר)

---

## 🎯 אודות הפרויקט

**AI Recaps Maker** היא פלטפורמה חדשנית ליצירת סיכומי וידאו אוטומטיים מונעי AI. המערכת משתמשת ב-Google Gemini API ליצירת סיכומים איכותיים, מדויקים ומרתקים של סרטים, סדרות וסרטונים.

### 🎨 עיצוב Steampunk ייחודי

האפליקציה כוללת עיצוב Steampunk מלא עם:
- אנימציות גלגלי שיניים דינמיות
- אפקטי קיטור ועשן
- ערכת צבעים Brass/Copper עשירה
- מעברים חלקים ואפקטים ויזואליים מתקדמים

### 💡 BYOK - Bring Your Own Key

המערכת תומכת ב-BYOK (Bring Your Own Key) - הבא את המפתחות שלך:
- 🔑 YouTube Data API v3
- 🔑 Google Search API
- 🔑 Google Gemini API
- 🔑 Search Engine ID

---

## ✨ תכונות עיקריות

### 🎬 יצירת סיכומים חכמה
- **6 שלבי עיבוד**: קלט → עיבוד אודיו → העלאת וידאו → ניתוח וידאו → התאמה חכמה → רינדור סופי
- **תמיכה במקורות מגוונים**: טקסט, TXT, MP3, MP4, YouTube
- **הגדרות מתקדמות**: בחירת ז'אנר, אורך סיכום מותאם אישית, מרווח חיתוך

### 🤖 AI ולמידה מתמשכת
- **Google Gemini Integration**: AI חכם לניתוח וסיכום תוכן
- **YouTube Learning**: למידה מ-11 ערוצי YouTube (1 אישי + 10 השראה)
- **Continuous Learning**: המערכת לומדת מהעדפותיך ומשתפרת עם הזמן
- **Global Learning**: תרומה אנונימית לשיפור המערכת

### 💰 מערכת קרדיטים ומודעות
- **Credits Wallet**: ארנק קרדיטים מובנה
- **AdSense Integration**: מודעות Rewarded ו-Interstitial
- **Unlock Slots**: פתיחת משבצות YouTube נוספות עם מודעות

### 📊 Analytics ו-Monitoring
- **Pipeline Monitor**: ניטור תהליכי עיבוד בזמן אמת
- **Charts & Stats**: גרפים אינטראקטיביים עם Recharts
- **Performance Tracking**: מעקב אחר ביצועים וזמני עיבוד

### 🌐 פיצ'רים חברתיים
- **Gallery**: גלריית סיכומים ציבורית עם פילטרים
- **Social Sharing**: שיתוף ב-WhatsApp, Facebook, Twitter
- **Privacy Controls**: בקרת פרטיות - ציבורי/פרטי לכל סיכום
- **Rating System**: דירוג וסנטימנט למשוב משתמשים

### 🔔 התראות ועדכונים
- **Browser Push Notifications**: התראות דחיפה בדפדפן
- **Email Notifications**: עדכונים במייל
- **Real-time Updates**: עדכונים בזמן אמת על סטטוס הסיכומים

### 🔐 אבטחה ואימות
- **Email + Password**: אימות סטנדרטי עם OTP
- **Google OAuth**: התחברות מהירה עם Google
- **Encrypted API Keys**: הצפנת מפתחות API במסד נתונים
- **RLS Policies**: Row Level Security מלא

### 📱 רספונסיביות ונגישות
- **Mobile-First Design**: עיצוב מותאם לנייד
- **24 שפות**: תמיכה ב-24 שפות כולל RTL
- **Accessibility**: תמיכה בנגישות WCAG

---

## 🛠️ טכנולוגיות

### Frontend
| טכנולוגיה | גרסה | תיאור |
|-----------|------|--------|
| **React** | 18.3.1 | ספריית UI |
| **TypeScript** | 5.5.3 | Type Safety |
| **Vite** | 5.4.1 | Build Tool |
| **Tailwind CSS** | 3.4.11 | Utility-First CSS |
| **React Router** | 6.x | ניווט |
| **React Query** | 5.x | State Management |
| **Lucide React** | - | אייקונים |
| **Recharts** | - | גרפים |
| **Framer Motion** | 12.x | אנימציות |

### Backend & Services
| שירות | תיאור |
|-------|--------|
| **OnSpace Cloud** | Backend as a Service (Supabase Compatible) |
| **PostgreSQL** | מסד נתונים ראשי |
| **Supabase Storage** | אחסון קבצים |
| **Edge Functions** | פונקציות Serverless |

### Third-Party APIs
- **Google Gemini API** - AI לסיכומים
- **YouTube Data API v3** - למידה מערוצים
- **Google Search API** - חיפוש ברשת
- **Google AdSense** - מודעות

---

## 🚀 התחלה מהירה

### דרישות מקדימות

```bash
Node.js >= 18.0.0
npm >= 9.0.0
Git
```

### התקנה

1. **Clone הפרויקט**
```bash
git clone https://github.com/yaskovbs/AI-Recaps-Web-App.git
cd AI-Recaps-Web-App
```

2. **התקנת תלויות**
```bash
npm install
```

3. **הגדרת משתני סביבה**
```bash
cp .env.example .env
```

ערוך את `.env` והזן את הערכים שלך:
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

4. **הרצת שרת פיתוח**
```bash
npm run dev
```

האפליקציה תרוץ ב-`http://localhost:5173`

### בניית הפרויקט

```bash
npm run build
```

הקבצים יישמרו בתיקיית `dist/`

---

## ⚙️ הגדרות סביבה

### משתני סביבה נדרשים

| משתנה | תיאור | דוגמה |
|-------|--------|-------|
| `VITE_SUPABASE_URL` | URL של OnSpace Cloud | `https://xxx.backend.onspace.ai` |
| `VITE_SUPABASE_ANON_KEY` | Anon Key של OnSpace Cloud | `eyJhbGc...` |

### API Keys (BYOK)

המפתחות הבאים נשמרים **דרך האפליקציה** (Settings → API Settings):

| API | תיאור | איך להשיג |
|-----|--------|----------|
| **YouTube Data API v3** | גישה ל-YouTube | [Google Cloud Console](https://console.cloud.google.com/) |
| **Google Search API** | חיפוש ברשת | [Google Cloud Console](https://console.cloud.google.com/) |
| **Search Engine ID** | מזהה מנוע חיפוש | [Programmable Search Engine](https://programmablesearchengine.google.com/) |
| **Google Gemini API** | AI לסיכומים | [Google AI Studio](https://makersuite.google.com/app/apikey) |

### הגדרת OnSpace Cloud Backend

1. עבור ל-[OnSpace Cloud Dashboard](https://onspace.ai)
2. צור פרויקט חדש או השתמש בקיים
3. **Database**: הטבלאות נוצרות אוטומטית דרך migrations
4. **Storage**: Bucket `recap-assets` נוצר אוטומטית
5. **Auth**: הפעל Email + Google OAuth (אופציונלי)

---

## 🌍 פריסה ל-Production

### Cloudflare Pages (מומלץ)

1. **התחבר ל-Cloudflare Dashboard**
   - עבור ל-[Cloudflare Pages](https://pages.cloudflare.com/)
   - לחץ על "Create a project"

2. **חבר את GitHub Repository**
   - בחר את `AI-Recaps-Web-App`
   - אשר הרשאות

3. **הגדר Build Settings**
   ```
   Framework preset: Vite
   Build command: npm run build
   Build output directory: dist
   Root directory: /
   Node version: 22
   ```

4. **הוסף Environment Variables**
   - `VITE_SUPABASE_URL` = your_backend_url
   - `VITE_SUPABASE_ANON_KEY` = your_anon_key

5. **Deploy**
   - לחץ "Save and Deploy"
   - האתר יפרס אוטומטית ב-`*.pages.dev`

6. **Custom Domain (אופציונלי)**
   - Pages → Custom domains → Add domain
   - עקוב אחרי ההוראות להגדרת DNS

### Vercel

```bash
npm install -g vercel
vercel
```

עקוב אחרי ההוראות ב-CLI.

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Google Cloud Run / AWS / Azure

הפרויקט תומך בכל פלטפורמת hosting שתומכת ב-static sites. השתמש ב-`npm run build` ופרוס את תיקיית `dist/`.

---

## 📁 מבנה הפרויקט

```
AI-Recaps-Web-App/
├── 📂 public/              # קבצים סטטיים
│   ├── ads.txt             # Google AdSense verification
│   └── .clear-cache        # Cache invalidation
│
├── 📂 src/
│   ├── 📂 components/      # React Components
│   │   ├── 📂 ui/          # shadcn/ui components (READ-ONLY)
│   │   ├── 📂 ads/         # AdSense components
│   │   ├── 📂 charts/      # Recharts wrappers
│   │   ├── 📂 export/      # Export functionality
│   │   ├── 📂 layout/      # Header, Footer
│   │   ├── 📂 social/      # Social features
│   │   └── 📂 steampunk/   # Steampunk animations
│   │
│   ├── 📂 pages/           # Route pages
│   │   ├── Home.tsx        # דף הבית
│   │   ├── Create.tsx      # יצירת סיכום (6 שלבים)
│   │   ├── MyRecaps.tsx    # הסיכומים שלי
│   │   ├── Gallery.tsx     # גלריה ציבורית
│   │   ├── Analytics.tsx   # אנליטיקס
│   │   ├── Wallet.tsx      # ארנק קרדיטים
│   │   ├── YouTubeLearning.tsx  # ניהול ערוצים
│   │   ├── Settings.tsx    # הגדרות + BYOK
│   │   ├── Login.tsx       # התחברות
│   │   ├── Signup.tsx      # הרשמה
│   │   ├── Contact.tsx     # צור קשר
│   │   ├── Terms.tsx       # תנאי שימוש
│   │   ├── Privacy.tsx     # מדיניות פרטיות
│   │   └── FAQ.tsx         # שאלות נפוצות
│   │
│   ├── 📂 hooks/           # Custom React Hooks
│   │   ├── useWallet.ts
│   │   ├── useYouTubeChannels.ts
│   │   ├── useRating.ts
│   │   └── useChatbot.ts
│   │
│   ├── 📂 lib/             # ספריות עזר
│   │   ├── AuthContext.tsx         # אימות
│   │   ├── LanguageContext.tsx     # תרגום
│   │   ├── supabase.ts             # Supabase client
│   │   ├── i18n.ts                 # 24 שפות
│   │   ├── apiKeysService.ts       # ניהול API keys
│   │   ├── notificationService.ts  # התראות
│   │   └── recapService.ts         # לוגיקת סיכומים
│   │
│   ├── App.tsx             # Root component + Routes
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles + Tailwind
│
├── 📄 .env                 # משתני סביבה (לא ב-Git)
├── 📄 .nvmrc               # Node version
├── 📄 package.json         # תלויות
├── 📄 vite.config.ts       # Vite configuration
├── 📄 tailwind.config.ts   # Tailwind configuration
├── 📄 tsconfig.json        # TypeScript configuration
└── 📄 README.md            # התיעוד הזה
```

---

## 📚 תיעוד API

### OnSpace Cloud Database

#### טבלאות עיקריות

| טבלה | תיאור | RLS |
|------|--------|-----|
| `user_profiles` | פרופילי משתמשים | ✅ |
| `public_recaps` | סיכומים ציבוריים | ✅ |
| `youtube_channels` | ערוצי למידה | ✅ |
| `api_keys` | מפתחות API מוצפנים | ✅ |
| `ad_views` | צפיות במודעות | ✅ |
| `user_preferences` | העדפות משתמשים | ✅ |
| `contact_submissions` | פניות צור קשר | ✅ |

#### Storage Buckets

| Bucket | Public | תיאור |
|--------|--------|--------|
| `recap-assets` | ✅ | וידאו, אודיו, תמונות |

### Google APIs

#### YouTube Data API v3
```typescript
// דוגמה לחיפוש ערוץ
const response = await fetch(
  `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=channel&key=${apiKey}`
);
```

#### Google Gemini API
```typescript
// דוגמה ליצירת סיכום
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const result = await model.generateContent(prompt);
```

---

## 🌐 תמיכה רב-לשונית

האפליקציה תומכת ב-**24 שפות** עם תמיכה מלאה ב-RTL:

| שפה | קוד | RTL | סטטוס |
|-----|-----|-----|-------|
| עברית | `he` | ✅ | ✅ מלא |
| English | `en` | ❌ | ✅ מלא |
| العربية | `ar` | ✅ | ✅ מלא |
| Español | `es` | ❌ | 🔄 חלקי |
| Français | `fr` | ❌ | 🔄 חלקי |
| Deutsch | `de` | ❌ | 🔄 חלקי |
| Русский | `ru` | ❌ | 🔄 חלקי |
| 中文 | `zh` | ❌ | 🔄 חלקי |
| 日本語 | `ja` | ❌ | 🔄 חלקי |
| +15 שפות נוספות | ... | - | 🔄 חלקי |

### הוספת שפה חדשה

1. פתח את `src/lib/i18n.ts`
2. הוסף אובייקט תרגום חדש:
```typescript
export const translations = {
  // ...
  newLang: {
    common: { appName: '...' },
    nav: { home: '...' },
    // ...
  }
};
```
3. עדכן את ה-`Language` type
4. הוסף את השפה ל-Language Switcher ב-`Header.tsx`

---

## 🤝 תרומה לפרויקט

אנחנו מברכים כל תרומה! הנה איך אתה יכול לעזור:

### דיווח על באגים

1. בדוק שהבאג לא דווח כבר ב-[Issues](https://github.com/yaskovbs/AI-Recaps-Web-App/issues)
2. צור Issue חדש עם:
   - כותרת ברורה
   - תיאור מפורט של הבעיה
   - צעדים לשחזור
   - סביבת עבודה (דפדפן, OS, וכו')
   - Screenshots אם רלוונטי

### הצעת תכונות

1. בדוק ב-[Issues](https://github.com/yaskovbs/AI-Recaps-Web-App/issues) אם התכונה לא הוצעה
2. צור Feature Request עם:
   - תיאור התכונה
   - Use cases
   - דוגמאות מוצרים דומים (אם יש)

### Pull Requests

1. **Fork** את הפרויקט
2. צור **branch** חדש:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit** השינויים:
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push** ל-branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. פתח **Pull Request**

### Code Style

- עקוב אחרי ESLint rules
- השתמש ב-TypeScript types
- כתוב קומפוננטות פונקציונליות
- הוסף comments למקומות מורכבים

---

## 📄 רישיון

הפרויקט הזה מופץ תחת רישיון **MIT License**.

```
MIT License

Copyright (c) 2026 AI Recaps Maker

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 יצירת קשר

**Y-L-B-S AI Studio Apps**

- 📧 Email: [contact-us@y-l-b-s-ai-studio-apps.com](mailto:contact-us@y-l-b-s-ai-studio-apps.com)
- 📱 Phone: 050-818-1948
- 🌐 Website: [AI Recaps Maker](https://ai-recaps-maker.onspace.app)
- 💼 GitHub: [@yaskovbs](https://github.com/yaskovbs)
- 🔗 Linktree: [linktr.ee/ylbsaistudioapps](https://linktr.ee/ylbsaistudioapps)

---

## 🙏 תודות

תודה מיוחדת ל:
- **Google** - Gemini API, YouTube API
- **OnSpace** - Cloud Backend Platform
- **Tailwind CSS** - CSS Framework
- **React Team** - UI Library
- **shadcn/ui** - Component Library
- **Lucide** - Icons
- הקהילה המדהימה של Open Source

---

## 🗺️ Roadmap

### גרסה 1.3.0 (בקרוב)
- [ ] תמיכה ב-Video Streaming (HLS)
- [ ] Editor מובנה לעריכת סיכומים
- [ ] Templates מוכנים לסיכומים
- [ ] Advanced Analytics Dashboard
- [ ] Mobile App (React Native)

### גרסה 1.4.0 (עתידית)
- [ ] AI Voice-over Generation
- [ ] Multi-user Collaboration
- [ ] API ציבורית למפתחים
- [ ] Plugin System
- [ ] White Label Support

### תכונות בבדיקה
- [ ] Subtitle Generation (SRT/VTT)
- [ ] Auto-upload to YouTube
- [ ] Monetization options
- [ ] Advanced Gamification
- [ ] Social Features Enhancement

---

<div align="center">

**⭐ אם אהבת את הפרויקט, תן לנו Star ב-GitHub! ⭐**

Made with ❤️ by Y-L-B-S AI Studio Apps

</div>
