import { useState } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Suggestion {
  id: string;
  text: string;
  category: 'script' | 'settings' | 'optimization' | 'general';
}

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'שלום! 👋 אני העוזר החכם שלך ליצירת סיכומים. איך אוכל לעזור לך היום?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    { id: '1', text: 'איך ליצור סיכום טוב?', category: 'general' },
    { id: '2', text: 'תן לי טיפים לתסריט', category: 'script' },
    { id: '3', text: 'מהן ההגדרות המומלצות?', category: 'settings' },
    { id: '4', text: 'כיצד לשפר את הסיכום?', category: 'optimization' },
  ]);

  const sendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response (in production, call Gemini API)
    setTimeout(() => {
      const response = generateResponse(content);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);

      // Update suggestions based on context
      updateSuggestions(content);
    }, 1000);
  };

  const generateResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    // Script tips
    if (input.includes('תסריט') || input.includes('טיפים') || input.includes('script')) {
      return `💡 טיפים לתסריט מעולה:

1. **התחל עם הוק חזק** - משפט פתיחה שימשוך את הקהל
2. **פרק למקטעים** - כל מקטע צריך להיות 30-60 שניות
3. **השתמש בשפה פשוטה** - הימנע מז'רגון מסובך
4. **סיפור עם התחלה, אמצע וסוף** - מבנה קלאסי עובד!
5. **קריאה לפעולה** - סיים עם מסר ברור

רוצה עזרה נוספת עם משהו ספציפי?`;
    }

    // Settings recommendations
    if (input.includes('הגדרות') || input.includes('settings') || input.includes('ממליץ')) {
      return `⚙️ הגדרות מומלצות:

**לסרטים ארוכים (2+ שעות):**
- אורך סיכום: 3-5 דקות
- חיתוכים: כל 30 שניות
- זוהר ברקע: כן

**לסדרות טלוויזיה:**
- אורך סיכום: 2-3 דקות
- חיתוכים: כל 20 שניות
- AI alignment: מומלץ מאוד

**לתוכן קצר:**
- אורך סיכום: 1-2 דקות
- חיתוכים: כל 15 שניות

מה סוג התוכן שלך?`;
    }

    // Optimization tips
    if (input.includes('שיפור') || input.includes('אופטימ') || input.includes('optimize')) {
      return `🚀 דרכים לשפר את הסיכום:

1. **השתמש בלמידה מתמשכת** - המערכת תלמד מההעדפות שלך
2. **הוסף ערוצי YouTube להשראה** - עד 11 ערוצים!
3. **התאם את ה-AI alignment** - לסנכרון מושלם
4. **בדוק sentiment analysis** - לראות איך הקהל מגיב
5. **שתף ברשתות חברתיות** - לקבל פידבק

רוצה הסבר מפורט על אחד מהנושאים?`;
    }

    // Getting started
    if (input.includes('להתחיל') || input.includes('איך') || input.includes('מה עושים')) {
      return `🌟 בוא נתחיל!

**שלב 1:** לחץ על "צור סיכום חדש"
**שלב 2:** הדבק את התסריט או העלה קובץ
**שלב 3:** בחר הגדרות (או השאר את המומלצות)
**שלב 4:** לחץ "המשך" דרך 5 השלבים
**שלב 5:** קבל את הסיכום המוכן!

💡 **טיפ:** התחל פשוט ושדרג בהדרגה. המערכת תלמד מההעדפות שלך.

רוצה עזרה עם שלב מסוים?`;
    }

    // Default helpful response
    return `אני כאן לעזור! אוכל לתת לך:

✨ **עזרה בכתיבת תסריט**
⚙️ **המלצות להגדרות**
🎯 **טיפים לאופטימיזציה**
📊 **ניתוח ביצועים**

מה מעניין אותך?`;
  };

  const updateSuggestions = (userInput: string) => {
    const input = userInput.toLowerCase();
    let newSuggestions: Suggestion[] = [];

    if (input.includes('תסריט')) {
      newSuggestions = [
        { id: 's1', text: 'דוגמאות לתסריטים טובים', category: 'script' },
        { id: 's2', text: 'איך לכתוב הוק משכנע?', category: 'script' },
        { id: 's3', text: 'מה האורך האידיאלי?', category: 'script' },
      ];
    } else if (input.includes('הגדרות')) {
      newSuggestions = [
        { id: 's1', text: 'מה זה AI alignment?', category: 'settings' },
        { id: 's2', text: 'כמה זמן צריך סיכום?', category: 'settings' },
        { id: 's3', text: 'למה להשתמש בלמידה מתמשכת?', category: 'optimization' },
      ];
    } else {
      newSuggestions = [
        { id: 's1', text: 'הצג דוגמה לסיכום', category: 'general' },
        { id: 's2', text: 'מה ההבדל בין המצבים?', category: 'general' },
        { id: 's3', text: 'כיצד לשתף ברשתות?', category: 'general' },
      ];
    }

    setSuggestions(newSuggestions);
  };

  const selectSuggestion = (suggestion: Suggestion) => {
    sendMessage(suggestion.text);
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'שלום! 👋 אני העוזר החכם שלך ליצירת סיכומים. איך אוכל לעזור לך היום?',
        timestamp: new Date().toISOString(),
      },
    ]);
    setSuggestions([
      { id: '1', text: 'איך ליצור סיכום טוב?', category: 'general' },
      { id: '2', text: 'תן לי טיפים לתסריט', category: 'script' },
      { id: '3', text: 'מהן ההגדרות המומלצות?', category: 'settings' },
      { id: '4', text: 'כיצד לשפר את הסיכום?', category: 'optimization' },
    ]);
  };

  return {
    messages,
    isLoading,
    suggestions,
    sendMessage,
    selectSuggestion,
    clearChat,
  };
}
