import React, { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function FAQ() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      category: 'כללי',
      question: 'מה זה AI Recaps Maker?',
      answer:
        'AI Recaps Maker הוא שירות מתקדם המאפשר ליצור סיכומי וידאו אוטומטיים של סרטים וסדרות באמצעות בינה מלאכותית. המערכת מנתחת את התוכן, מחלצת את הרגעים החשובים ביותר, ויוצרת סיכום מקצועי ומושלם.',
    },
    {
      category: 'כללי',
      question: 'איך זה עובד?',
      answer:
        'התהליך כולל 5 שלבים פשוטים: 1) העלאת תסריט או קובץ אודיו, 2) עיבוד אודיו, 3) ניתוח וידאו, 4) התאמה חכמה בין אודיו לוידאו, 5) רינדור סופי. המערכת משתמשת ב-Google Gemini AI כדי ליצור סיכום איכותי ומדויק.',
    },
    {
      category: 'חשבון וקרדיטים',
      question: 'מה זה קרדיטים ואיך משיגים אותם?',
      answer:
        'קרדיטים הם המטבע הפנימי של המערכת. ניתן להרוויח קרדיטים בחינם על ידי צפייה במודעות - כל מודעה מתגמלת שנצפתה מעניקה קרדיט אחד. יצירת סיכום חדש דורשת קרדיט אחד.',
    },
    {
      category: 'חשבון וקרדיטים',
      question: 'האם אפשר לקנות קרדיטים?',
      answer:
        'כרגע הדרך היחידה לקבל קרדיטים היא צפייה במודעות מתגמלות. בעתיד אנו מתכננים להוסיף אפשרויות רכישה ומנויים מתקדמים.',
    },
    {
      category: 'BYOK',
      question: 'מה זה BYOK ולמה אני צריך את זה?',
      answer:
        'BYOK (Bring Your Own Key) מאפשר לך להשתמש במפתחות API שלך עצמך במקום להסתמך על המפתחות המשותפים של המערכת. זה נותן לך שליטה מלאה, מכסות גבוהות יותר, ועדיפות בעיבוד.',
    },
    {
      category: 'BYOK',
      question: 'אילו מפתחות API אני צריך?',
      answer:
        'לשימוש מלא במערכת מומלץ: 1) YouTube Data API v3 - ללמידה מערוצים, 2) Google Search API - לחיפוש מידע נוסף, 3) Google Gemini API - לעיבוד AI. כל אחד מהמפתחות האלה אופציונלי, והשירות יעבוד גם בלעדיהם.',
    },
    {
      category: 'למידה מתמשכת',
      question: 'מה זה למידה מתמשכת?',
      answer:
        'למידה מתמשכת היא תכונה המאפשרת למערכת ללמוד מההעדפות והסגנון שלך ולשפר את ההמלצות והסיכומים. קיימות שתי רמות: למידה אישית (רק בחשבון שלך) ולמידה גלובלית (מאונמת, בהסכמה מפורשת).',
    },
    {
      category: 'למידה מתמשכת',
      question: 'האם המידע שלי מוגן בלמידה גלובלית?',
      answer:
        'בהחלט! למידה גלובלית פועלת רק בהסכמתך המפורשת, והמידע עובר אנונימיזציה קשיחה - כל מזהים אישיים, שמות משתמש וטקסט רגיש מוסרים. רק נתונים סטטיסטיים מצטברים נשמרים. אתה יכול לכבות או לאפס את פרופיל הלמידה בכל עת.',
    },
    {
      category: 'YouTube Learning',
      question: 'איך עובד ניהול ערוצי YouTube ללמידה?',
      answer:
        'אתה יכול להוסיף עד 11 ערוצי YouTube (1 ערוץ אישי + 10 ערוצי השראה) שהמערכת תלמד מהם. המערכת מנתחת סרטונים, Shorts ושידורים חיים מה-90 הימים האחרונים כדי להבין מגמות וסגנונות ולשפר את ההמלצות.',
    },
    {
      category: 'YouTube Learning',
      question: 'איך פותחים משבצות נוספות לערוצים?',
      answer:
        'ברירת המחדל היא 11 משבצות. ניתן לפתוח משבצות נוספות (עד 15, 22 ובסופו של דבר ללא הגבלה) באמצעות צפייה ב-2 מודעות או הוצאת 2 קרדיטים. כל משבצת נפתחת ל-7 ימים.',
    },
    {
      category: 'טכני',
      question: 'אילו פורמטים נתמכים להעלאה?',
      answer:
        'המערכת תומכת ב: קבצי טקסט (.txt), קבצי אודיו (.mp3), קובצי וידאו (mp4, avi, mov), וגם קישורי YouTube ישירים. ניתן גם להדביק טקסט ישירות בממשק.',
    },
    {
      category: 'טכני',
      question: 'כמה זמן לוקח ליצור סיכום?',
      answer:
        'זמן העיבוד תלוי באורך הסרט ובמורכבות הסיכום. בממוצע, סיכום סטנדרטי (3-5 דקות) של סרט בן שעתיים לוקח בין 5-10 דקות. אתה יכול לעקוב אחרי ההתקדמות בזמן אמת במסך Analytics.',
    },
    {
      category: 'טכני',
      question: 'מה קורה אם העיבוד נכשל?',
      answer:
        'המערכת כוללת מנגנון fallback אוטומטי. אם שלב מסוים נכשל, המערכת תנסה שוב או תעבור למצב גיבוי. כל האירועים נרשמים ב-timeline ואתה יכול לראות בדיוק מה קרה ולמה.',
    },
    {
      category: 'אבטחה ופרטיות',
      question: 'איך המפתחות שלי מאוחסנים?',
      answer:
        'מפתחות API נשמרים מוצפנים גם בשרת וגם במכשיר שלך. גישה למפתחות דורשת פתיחת כספת עם PIN בן 6 ספרות (ובמובייל גם ביומטרי). אנחנו לא יכולים לראות או להשתמש במפתחות שלך.',
    },
    {
      category: 'אבטחה ופרטיות',
      question: 'האם אתם רואים את הסיכומים שאני יוצר?',
      answer:
        'אנו רואים רק מטא-דאטה (אורך, תאריך, סטטוס) לצורך שיפור השירות. התוכן עצמו נשאר פרטי ומוצפן. אנו לא משתפים או מוכרים את המידע שלך לצדדים שלישיים.',
    },
    {
      category: 'תמיכה',
      question: 'איך אפשר ליצור קשר לתמיכה?',
      answer:
        'ניתן ליצור קשר דרך: אימייל contact-us@y-l-b-s-ai-studio-apps.com, טלפון 050-818-1948, או דרך עמוד יצירת הקשר באתר. אנו עונים בדרך כלל תוך 24 שעות.',
    },
  ];

  const categories = Array.from(new Set(faqs.map((faq) => faq.category)));

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-brass-200 mb-4 flex items-center gap-3">
            <HelpCircle className="w-10 h-10" />
            שאלות נפוצות
          </h1>
          <p className="text-brass-300">מצא תשובות לשאלות הנפוצות ביותר</p>
        </div>

        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">{category}</h2>
            <div className="space-y-3">
              {faqs
                .filter((faq) => faq.category === category)
                .map((faq, index) => {
                  const globalIndex = faqs.indexOf(faq);
                  const isOpen = openIndex === globalIndex;

                  return (
                    <div key={globalIndex} className="steampunk-card overflow-hidden">
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                        className="w-full p-6 flex items-center justify-between text-right hover:bg-brass-900/20 transition-colors"
                      >
                        <span className="text-brass-200 font-semibold">{faq.question}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-brass-400 flex-shrink-0 mr-4" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-brass-400 flex-shrink-0 mr-4" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-6 text-brass-300 leading-relaxed border-t border-brass-700/20 pt-4">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}

        {/* Contact CTA */}
        <div className="steampunk-card p-8 bg-gradient-to-br from-brass-900/40 to-copper-900/40 text-center">
          <HelpCircle className="w-12 h-12 text-brass-400 mx-auto mb-4" />
          <h3 className="text-xl font-serif font-semibold text-brass-200 mb-2">
            לא מצאת תשובה?
          </h3>
          <p className="text-brass-300 mb-4">אנחנו כאן לעזור! צור קשר ונשמח לענות על כל שאלה.</p>
          <a href="/contact" className="steampunk-button inline-block">
            צור קשר
          </a>
        </div>
      </div>
    </div>
  );
}
