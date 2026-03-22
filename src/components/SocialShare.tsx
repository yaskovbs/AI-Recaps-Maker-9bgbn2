import React from 'react';
import { Share2, MessageCircle, Send } from 'lucide-react';

interface SocialShareProps {
  title: string;
  description: string;
  url: string;
  className?: string;
}

export default function SocialShare({ title, description, url, className = '' }: SocialShareProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  return (
    <div className={`social-share flex items-center gap-2 ${className}`}>
      <span className="text-sm text-brass-300 ml-2">שתף:</span>
      
      {/* WhatsApp */}
      <button
        onClick={() => handleShare('whatsapp')}
        className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center transition-all transform hover:scale-110"
        title="שתף ב-WhatsApp"
      >
        <MessageCircle className="w-5 h-5 text-white" />
      </button>

      {/* Telegram */}
      <button
        onClick={() => handleShare('telegram')}
        className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center transition-all transform hover:scale-110"
        title="שתף ב-Telegram"
      >
        <Send className="w-5 h-5 text-white" />
      </button>

      {/* Twitter/X */}
      <button
        onClick={() => handleShare('twitter')}
        className="w-10 h-10 rounded-full bg-black hover:bg-gray-800 flex items-center justify-center transition-all transform hover:scale-110"
        title="שתף ב-X (Twitter)"
      >
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>

      {/* Facebook */}
      <button
        onClick={() => handleShare('facebook')}
        className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-all transform hover:scale-110"
        title="שתף ב-Facebook"
      >
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </button>

      {/* Native Share (if supported) */}
      {navigator.share && (
        <button
          onClick={handleNativeShare}
          className="w-10 h-10 rounded-full bg-brass-600 hover:bg-brass-500 flex items-center justify-center transition-all transform hover:scale-110"
          title="שיתוף נוסף"
        >
          <Share2 className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
}
