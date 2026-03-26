import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { CONTACT_EMAIL, CONTACT_PHONE } from '@/constants/contact';
import { FileText, Calendar } from 'lucide-react';

export default function Terms() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="steampunk-card p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold text-brass-200 mb-4 flex items-center gap-3">
              <FileText className="w-10 h-10" />
              תנאי שימוש
            </h1>
            <div className="flex items-center gap-2 text-brass-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">עדכון אחרון: 21 במרץ 2026</span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                1. קבלת התנאים
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                ברוכים הבאים ל-AI Recaps Maker & Auto Post. על ידי גישה ושימוש בשירות זה, אתה מסכים
                להיות מחויב לתנאי שימוש אלה. אם אינך מסכים לתנאים אלה, אנא אל תשתמש בשירות.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                2. תיאור השירות
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                AI Recaps Maker הוא שירות מבוסס בינה מלאכותית המאפשר למשתמשים ליצור, לערוך ולפרסם
                סיכומי וידאו אוטומטיים של סרטים וסדרות באמצעות טכנולוגיית Google Gemini.
              </p>
              <ul className="list-disc list-inside text-brass-300 space-y-2 mr-6">
                <li>יצירת סיכומים מונעי AI</li>
                <li>עיבוד וניתוח וידאו ואודיו</li>
                <li>פרסום אוטומטי ברשתות חברתיות</li>
                <li>למידה מתמשכת והתאמה אישית</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                3. חשבון משתמש
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                כדי להשתמש בתכונות מסוימות של השירות, עליך ליצור חשבון. אתה אחראי על:
              </p>
              <ul className="list-disc list-inside text-brass-300 space-y-2 mr-6">
                <li>שמירה על סודיות פרטי החשבון שלך</li>
                <li>כל הפעילויות המתבצעות תחת חשבונך</li>
                <li>עדכון מידע מדויק ועדכני</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                4. שימוש מותר
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                אתה מסכים שלא:
              </p>
              <ul className="list-disc list-inside text-brass-300 space-y-2 mr-6">
                <li>להשתמש בשירות למטרות בלתי חוקיות</li>
                <li>להפר זכויות יוצרים או קניין רוחני</li>
                <li>לנסות לפרוץ או להפריע לפעולת השירות</li>
                <li>להעתיק או לשכפל חלקים מהשירות ללא אישור</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                5. קרדיטים ותשלומים
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                השירות משתמש במערכת קרדיטים:
              </p>
              <ul className="list-disc list-inside text-brass-300 space-y-2 mr-6">
                <li>ניתן להרוויח קרדיטים באמצעות צפייה במודעות</li>
                <li>קרדיטים נדרשים ליצירת סיכומים</li>
                <li>קרדיטים אינם ניתנים להחזר או להעברה</li>
                <li>אנו שומרים את הזכות לשנות את מערכת הקרדיטים</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                6. BYOK - Bring Your Own Key
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                אם אתה בוחר להשתמש במפתחות API משלך:
              </p>
              <ul className="list-disc list-inside text-brass-300 space-y-2 mr-6">
                <li>אתה אחראי לניהול ועלויות המפתחות שלך</li>
                <li>המפתחות נשמרים מוצפנים בשרת ובמכשיר שלך</li>
                <li>אנו לא נושאים באחריות לשימוש לרעה במפתחות</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                7. זכויות קניין רוחני
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                כל התוכן, סימני המסחר והקניין הרוחני הקשורים לשירות נשארים בבעלות AI Recaps Maker.
                תוכן שנוצר על ידך באמצעות השירות נשאר בבעלותך, אך אתה מעניק לנו רישיון להשתמש בו
                לצורכי שיפור השירות.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                8. הגבלת אחריות
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                השירות מסופק "כמות שהוא" ללא אחריות מכל סוג. לא נישא באחריות לנזקים ישירים או
                עקיפים הנובעים משימוש בשירות.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                9. שינויים בתנאים
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                אנו שומרים לעצמנו את הזכות לשנות תנאים אלה בכל עת. שינויים יכנסו לתוקף לאחר
                פרסומם באתר. המשך השימוש בשירות לאחר שינויים מהווה הסכמה לתנאים המעודכנים.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                10. יצירת קשר
              </h2>
              <p className="text-brass-300 leading-relaxed mb-4">
                לשאלות או בירורים לגבי תנאי השימוש, ניתן ליצור קשר:
              </p>
              <ul className="list-none text-brass-300 space-y-2">
                <li>📧 Email: {CONTACT_EMAIL}</li>
                <li>📞 Phone: {CONTACT_PHONE}</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
