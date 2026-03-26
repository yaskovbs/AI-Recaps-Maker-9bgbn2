import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

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
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: t.chatbot.greeting,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    { id: '1', text: t.chatbot.suggestions.howToCreate, category: 'general' },
    { id: '2', text: t.chatbot.suggestions.scriptTips, category: 'script' },
    { id: '3', text: t.chatbot.suggestions.recommendedSettings, category: 'settings' },
    { id: '4', text: t.chatbot.suggestions.howToImprove, category: 'optimization' },
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

    if (input.includes('תסריט') || input.includes('טיפים') || input.includes('script') || input.includes('tips')) {
      return t.chatbot.responses.scriptTips;
    }

    if (input.includes('הגדרות') || input.includes('settings') || input.includes('ממליץ') || input.includes('recommend')) {
      return t.chatbot.responses.settings;
    }

    if (input.includes('שיפור') || input.includes('אופטימ') || input.includes('optimize') || input.includes('improve')) {
      return t.chatbot.responses.optimization;
    }

    if (input.includes('להתחיל') || input.includes('איך') || input.includes('מה עושים') || input.includes('start') || input.includes('how')) {
      return t.chatbot.responses.gettingStarted;
    }

    return t.chatbot.responses.defaultHelp;
  };

  const updateSuggestions = (userInput: string) => {
    const input = userInput.toLowerCase();
    let newSuggestions: Suggestion[] = [];

    if (input.includes('תסריט') || input.includes('script')) {
      newSuggestions = [
        { id: 's1', text: t.chatbot.suggestions.scriptExamples, category: 'script' },
        { id: 's2', text: t.chatbot.suggestions.compellingHook, category: 'script' },
        { id: 's3', text: t.chatbot.suggestions.idealLength, category: 'script' },
      ];
    } else if (input.includes('הגדרות') || input.includes('settings')) {
      newSuggestions = [
        { id: 's1', text: t.chatbot.suggestions.whatIsAlignment, category: 'settings' },
        { id: 's2', text: t.chatbot.suggestions.howLong, category: 'settings' },
        { id: 's3', text: t.chatbot.suggestions.whyContinuousLearning, category: 'optimization' },
      ];
    } else {
      newSuggestions = [
        { id: 's1', text: t.chatbot.suggestions.showExample, category: 'general' },
        { id: 's2', text: t.chatbot.suggestions.modeDifference, category: 'general' },
        { id: 's3', text: t.chatbot.suggestions.howToShare, category: 'general' },
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
        content: t.chatbot.greeting,
        timestamp: new Date().toISOString(),
      },
    ]);
    setSuggestions([
      { id: '1', text: t.chatbot.suggestions.howToCreate, category: 'general' },
      { id: '2', text: t.chatbot.suggestions.scriptTips, category: 'script' },
      { id: '3', text: t.chatbot.suggestions.recommendedSettings, category: 'settings' },
      { id: '4', text: t.chatbot.suggestions.howToImprove, category: 'optimization' },
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
