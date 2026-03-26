import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { CONTACT_EMAIL, CONTACT_PHONE } from '@/constants/contact';
import { Shield, Calendar, Lock, Eye, Database, AlertCircle } from 'lucide-react';

export default function Privacy() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="steampunk-card p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold text-brass-200 mb-4 flex items-center gap-3">
              <Shield className="w-10 h-10" />
              מדיניות פרטיות
            </h1>
            <div className="flex items-center gap-2 text-brass-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">עדכון אחרון: 21 במרץ 2026</span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4 flex items-center gap-2">
                <Database className="w-6 h-6" />
                1. איזה מידע אנחנו אוספים
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                אנו אוספים מידע כדי לספק ולשפר את השירות שלנו:
              </p>
              <ul className="list-disc list-inside text-brass-300 space-y-2 mr-6">
                <li>
                  <strong>מידע חשבון:</strong> שם משתמש, אימייל, מזהה משתמש
                </li>
                <li>
                  <strong>תוכן שנוצר:</strong> סיכומים, סרטונים, קבצי אודיו שהעלת
                </li>
                <li>
                  <strong>שימוש:</strong> היסטוריית שימוש, העדפות, הגדרות
                </li>
                <li>
                  <strong>טכני:</strong> כתובת IP, סוג דפדפן, מערכת הפעלה
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6" />
                2. איך אנחנו משתמשים במידע
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                אנו משתמשים במידע שנאסף למטרות הבאות:
              </p>
              <ul className="list-disc list-inside text-brass-300 space-y-2 mr-6">
                <li>אספקת ותפעול השירות</li>
                <li>שיפור איכות ההמלצות והסיכומים</li>
                <li>ניתוח שימוש ופיתוח תכונות חדשות</li>
                <li>שליחת עדכונים והודעות חשובות</li>
                <li>אבטחת המערכת ומניעת שימוש לרעה</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6" />
                3. אבטחת מידע
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                אנו נוקטים אמצעים טכניים וארגוניים להגנה על המידע שלך:
              </p>
              <ul className="list-disc list-inside text-brass-300 space-y-2 mr-6">
                <li>
                  <strong>הצפנה:</strong> כל המידע מוצפן בתעבורה ובאחסון
                </li>
                <li>
                  <strong>BYOK:</strong> מפתחות API שלך מוצפנים באופן מאובטח
                </li>
                <li>
                  <strong>גישה מוגבלת:</strong> רק צוות מורשה יכול לגשת למידע
                </li>
                <li>
                  <strong>ניטור:</strong> מערכות ניטור וזיהוי פריצות פעילות 24/7
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                4. למידה מתמשכת ופרטיות
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                מערכת הלמידה המתמשכת שלנו:
              </p>
              <ul className="list-disc list-inside text-brass-300 space-y-2 mr-6">
                <li>
                  <strong>למידה אישית:</strong> שומרת העדפות אישיות בחשבון שלך בלבד
                </li>
                <li>
                  <strong>למידה גלובלית:</strong> רק עם הסכמה מפורשת, מידע מאונם לחלוטין
                </li>
                <li>
                  <strong>אנונימיזציה:</strong> שמות משתמש ומזהים אישיים מוסרים לפני שמירה גלובלית
                </li>
                <li>
                  <strong>שליטה מלאה:</strong> ניתן לכבות או לאפס את פרופיל הלמידה בכל עת
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                5. שיתוף מידע עם צדדים שלישיים
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                אנו <strong className="text-brass-100">לא</strong> מוכרים את המידע האישי שלך. אנו עשויים
                לשתף מידע רק במקרים הבאים:
              </p>
              <ul className="list-disc list-inside text-brass-300 space-y-2 mr-6">
                <li>
                  <strong>ספקי שירות:</strong> Google Gemini, Supabase, Cloudflare לצורך אספקת השירות
                </li>
                <li>
                  <strong>חובה חוקית:</strong> כאשר נדרש על פי חוק או צו שיפוטי
                </li>
                <li>
                  <strong>הסכמתך:</strong> כאשר אתה מאשר במפורש שיתוף
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                6. Cookies וטכנולוגיות מעקב
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                אנו משתמשים ב-Cookies ל:
              </p>
              <ul className="list-disc list-inside text-brass-300 space-y-2 mr-6">
                <li>שמירת העדפות שפה וממשק</li>
                <li>ניתוח שימוש באתר (Google Analytics)</li>
                <li>מודעות ממומנות (Google AdSense)</li>
              </ul>
              <p className="text-brass-300 leading-relaxed mt-4">
                ניתן לנהל העדפות Cookies דרך הגדרות הדפדפן שלך.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                7. הזכויות שלך
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                יש לך זכות:
              </p>
              <ul className="list-disc list-inside text-brass-300 space-y-2 mr-6">
                <li>לגשת למידע האישי שלך</li>
                <li>לתקן מידע לא מדויק</li>
                <li>למחוק את החשבון והמידע שלך</li>
                <li>להקפיא את החשבון זמנית</li>
                <li>לייצא את הנתונים שלך</li>
                <li>להתנגד לעיבוד מידע מסוים</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                8. שימוש על ידי קטינים
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                השירות מיועד למשתמשים מעל גיל 13. אנו לא אוספים במודע מידע מקטינים מתחת לגיל 13
                ללא הסכמת הורים.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                9. שינויים במדיניות
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                אנו עשויים לעדכן מדיניות פרטיות זו מעת לעת. נודיע על שינויים משמעותיים באמצעות:
              </p>
              <ul className="list-disc list-inside text-brass-300 space-y-2 mr-6">
                <li>הודעה באתר</li>
                <li>אימייל למשתמשים רשומים</li>
                <li>עדכון תאריך "עדכון אחרון" בראש המדיניות</li>
              </ul>
            </section>

            <section className="mb-8 bg-brass-900/20 border border-brass-600/30 rounded-lg p-6">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                10. יצירת קשר
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                לשאלות או בקשות הנוגעות לפרטיות, ניתן ליצור קשר:
              </p>
              <ul className="list-none text-brass-300 space-y-2">
                <li className="flex items-center gap-2">
                  📧 <strong>Email:</strong> {CONTACT_EMAIL}
                </li>
                <li className="flex items-center gap-2">
                  📞 <strong>Phone:</strong> {CONTACT_PHONE}
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
