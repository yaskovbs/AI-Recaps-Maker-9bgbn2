import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from '@/hooks/useChatbot';
import { useLanguage } from '@/lib/LanguageContext';
import { Send, Bot, User, Sparkles, X, Trash2 } from 'lucide-react';

interface GeminiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function GeminiChatbot({ isOpen, onClose, className = '' }: GeminiChatbotProps) {
  const { messages, isLoading, suggestions, sendMessage, selectSuggestion, clearChat } = useChatbot();
  const { language } = useLanguage();
  const locale = language === 'he' ? 'he-IL' : language === 'ar' ? 'ar-SA' : 'en-US';
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage(input);
    setInput('');
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-4 left-4 md:left-auto md:right-4 z-50 ${className}`}>
      <div className="w-96 max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-2rem)] steampunk-card flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-brass-700/30">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-brass-200">עוזר AI חכם</h3>
              <p className="text-xs text-brass-400">מופעל על ידי Google Gemini</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="p-2 hover:bg-steam-800/50 rounded-lg transition-colors"
              title="נקה שיחה"
            >
              <Trash2 className="w-4 h-4 text-brass-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-steam-800/50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-brass-400" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[75%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-brass-600 to-copper-600 text-white'
                    : 'bg-steam-800/50 border border-brass-700/30 text-brass-100'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <span className="text-xs opacity-60 mt-1 block">
                  {new Date(message.timestamp).toLocaleTimeString(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-steam-600 to-steam-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="bg-steam-800/50 border border-brass-700/30 rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-brass-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-brass-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-brass-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && !isLoading && (
          <div className="px-4 py-2 border-t border-brass-700/30">
            <div className="flex flex-wrap gap-2">
              {suggestions.map(suggestion => (
                <button
                  key={suggestion.id}
                  onClick={() => selectSuggestion(suggestion)}
                  className="px-3 py-1.5 bg-steam-800/50 hover:bg-steam-700/50 border border-brass-700/30 rounded-lg text-xs text-brass-300 transition-colors"
                >
                  {suggestion.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-brass-700/30">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="שאל משהו..."
              className="flex-1 steampunk-input px-4 py-2"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="steampunk-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
