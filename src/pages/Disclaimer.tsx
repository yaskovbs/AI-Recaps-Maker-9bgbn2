import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Shield, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Scale, Download, Eye, Clock, Mail, Phone, Github, ExternalLink } from 'lucide-react';

export default function Disclaimer() {
  const { user } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`disclaimer_accepted_${user.id}`);
      if (stored === 'true') setAccepted(true);
    }
  }, [user]);

  const handleAccept = async () => {
    if (!user) return;
    setIsAccepting(true);
    localStorage.setItem(`disclaimer_accepted_${user.id}`, 'true');
    setAccepted(true);
    setIsAccepting(false);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center mx-auto mb-4 glow-brass">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-brass-200 mb-3">
            DimensionDownload For Study
          </h1>
          <p className="text-brass-400 text-lg">
            AI Research Platform for Video Download &amp; Summary
          </p>
        </div>

        {/* Legal Disclaimer */}
        <div className="steampunk-card p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-6 h-6 text-copper-400" />
            <h2 className="text-2xl font-serif font-bold text-brass-200">
              Disclaimer & Terms of Use
            </h2>
          </div>

          <div className="bg-red-900/15 border border-red-700/30 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-semibold mb-1">Important Notice</p>
                <p className="text-sm text-red-400/80">
                  DimensionDownload For Study is intended for personal and educational use only.
                  By using this application, you agree to the terms outlined below.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 text-brass-300">
            <Section
              icon={<Eye className="w-5 h-5 text-brass-400" />}
              title="User Responsibility"
            >
              All downloading of content from YouTube or any other source is the sole responsibility of the user.
              The developers and operators of this application are not responsible for any misuse of downloaded content.
            </Section>

            <Section
              icon={<Shield className="w-5 h-5 text-brass-400" />}
              title="Copyright"
            >
              It is strictly prohibited to use this tool for downloading content for re-upload,
              commercial distribution, or any action that violates the copyright of content owners.
              Violation of this policy may result in legal consequences.
            </Section>

            <Section
              icon={<Download className="w-5 h-5 text-brass-400" />}
              title="Recommended Use"
            >
              We strongly recommend using this tool exclusively for videos from your personal channel
              or content for which you have explicit permission to download. This tool is designed
              for backup and study purposes only.
            </Section>

            <Section
              icon={<Clock className="w-5 h-5 text-brass-400" />}
              title="Temporary Storage (44-Day Policy)"
            >
              All processed files are stored temporarily for 44 days only. After this period,
              files are automatically and permanently deleted from the server. A countdown timer
              is displayed next to each file showing the exact time remaining before deletion.
            </Section>
          </div>
        </div>

        {/* Key Features */}
        <div className="steampunk-card p-8 mb-6">
          <h2 className="text-2xl font-serif font-bold text-brass-200 mb-6">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureItem
              title="BYOK (Bring Your Own Key)"
              description="Full control over costs. Enter your own YouTube and Gemini API keys."
            />
            <FeatureItem
              title="Smart Playlist Fetching"
              description="Automatic collection of complete playlists with real-time sync to Supabase."
            />
            <FeatureItem
              title="Live Countdown Timer"
              description="Each file shows an exact countdown to its automatic deletion date."
            />
            <FeatureItem
              title="AI Content Summary"
              description="Gemini AI analyzes and summarizes video content automatically."
            />
            <FeatureItem
              title="Priority Queue"
              description="Set task priority levels to control processing order."
            />
          </div>
        </div>

        {/* Environment Setup */}
        <div className="steampunk-card p-8 mb-6">
          <h2 className="text-2xl font-serif font-bold text-brass-200 mb-4">
            Environment Setup (BYOK)
          </h2>
          <p className="text-brass-400 text-sm mb-4">
            Configure your API keys in the Settings page. You will need:
          </p>
          <div className="bg-steam-900/50 border border-brass-700/20 rounded-lg p-4 font-mono text-sm text-brass-300 space-y-1">
            <p><span className="text-brass-500"># Google API Keys</span></p>
            <p>YOUTUBE_API_KEY=<span className="text-copper-400">your_youtube_api_key</span></p>
            <p>GEMINI_API_KEY=<span className="text-copper-400">your_gemini_api_key</span></p>
          </div>
        </div>

        {/* Contact */}
        <div className="steampunk-card p-8 mb-6">
          <h2 className="text-2xl font-serif font-bold text-brass-200 mb-6">
            Contact & Support
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ContactItem icon={<Mail className="w-5 h-5" />} label="Email" value="contact-us@y-l-b-s-ai-studio-apps.com" />
            <ContactItem icon={<Phone className="w-5 h-5" />} label="Phone" value="050-818-1948" />
            <ContactItem icon={<Github className="w-5 h-5" />} label="GitHub" value="@yaskovbs" href="https://github.com/yaskovbs" />
            <ContactItem icon={<ExternalLink className="w-5 h-5" />} label="YouTube" value="Movies & TV Show Recap" href="https://www.youtube.com/@MoviesandTVShowRecap" />
          </div>
        </div>

        {/* Accept Terms */}
        {user && !accepted && (
          <div className="steampunk-card p-8 text-center">
            <h3 className="text-xl font-serif font-bold text-brass-200 mb-3">
              Accept Terms to Continue
            </h3>
            <p className="text-brass-400 text-sm mb-6 max-w-md mx-auto">
              You must accept the terms and disclaimer above before creating video tasks.
            </p>
            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="steampunk-button px-8 py-3 flex items-center gap-2 mx-auto"
            >
              <CheckCircle className="w-5 h-5" />
              I Accept the Terms & Disclaimer
            </button>
          </div>
        )}

        {user && accepted && (
          <div className="bg-green-900/15 border border-green-700/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Terms accepted. You can now create video tasks.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <h3 className="text-brass-200 font-semibold mb-2">{title}</h3>
        <p className="text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-steam-900/30 border border-brass-700/20 rounded-lg p-4">
      <h4 className="text-brass-200 font-semibold text-sm mb-1">{title}</h4>
      <p className="text-xs text-brass-500">{description}</p>
    </div>
  );
}

function ContactItem({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-3 p-3 bg-steam-900/30 border border-brass-700/20 rounded-lg">
      <div className="text-brass-400">{icon}</div>
      <div>
        <p className="text-xs text-brass-500">{label}</p>
        <p className="text-sm text-brass-200">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
        {content}
      </a>
    );
  }

  return content;
}
