import React, { useState } from 'react';
import { X, Mail, Globe, Heart, Shield, Zap } from 'lucide-react';

interface HelpAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpAboutModal: React.FC<HelpAboutModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'about' | 'help' | 'legal'>('about');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4 bg-black/50">
      <div className="bg-background border-4 border-foreground w-full md:max-w-2xl max-h-[90vh] overflow-y-auto shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)]">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b-4 border-foreground p-4 flex justify-between items-center">
          <h2 className="text-2xl font-black uppercase">About THE V</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-foreground hover:text-background transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b-4 border-foreground">
          {(['about', 'help', 'legal'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 font-bold uppercase border-r-4 border-foreground transition-colors ${
                activeTab === tab
                  ? 'bg-foreground text-background'
                  : 'bg-background text-foreground hover:bg-foreground/10'
              }`}
            >
              {tab === 'about' && 'About'}
              {tab === 'help' && 'Help'}
              {tab === 'legal' && 'Legal'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black mb-3 flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  About THE V
                </h3>
                <p className="text-foreground/80 leading-relaxed">
                  THE V is a vibrant social media platform where authenticity matters. 
                  It's designed for people who want genuine connections, creative expression, 
                  and a community that celebrates individuality.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-4 border-foreground p-4">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Features
                  </h4>
                  <ul className="text-sm space-y-1 text-foreground/70">
                    <li>📸 Photos & Videos</li>
                    <li>💬 Real-time Messaging</li>
                    <li>👥 Followers & Community</li>
                    <li>🏆 Badges & Achievements</li>
                  </ul>
                </div>

                <div className="border-4 border-foreground p-4">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Privacy First
                  </h4>
                  <p className="text-sm text-foreground/70">
                    Your data is yours. We don't sell information. Full transparency on how we handle data.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-foreground/60">
                  Version 1.0.0 • Built with ❤️ • {new Date().getFullYear()}
                </p>
              </div>
            </div>
          )}

          {/* Help Tab */}
          {activeTab === 'help' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black mb-4">Frequently Asked Questions</h3>
              </div>

              <details className="border-4 border-foreground p-4 cursor-pointer group">
                <summary className="font-bold flex justify-between items-center">
                  <span>How do I create an account?</span>
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 text-foreground/80 text-sm">
                  Click "Sign Up" at the top and fill in your details. It takes less than a minute!
                </div>
              </details>

              <details className="border-4 border-foreground p-4 cursor-pointer group">
                <summary className="font-bold flex justify-between items-center">
                  <span>How do I report someone or their content?</span>
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 text-foreground/80 text-sm">
                  Click the three-dot menu on any post or profile and select "Report". 
                  Our team reviews all reports within 24 hours.
                </div>
              </details>

              <details className="border-4 border-foreground p-4 cursor-pointer group">
                <summary className="font-bold flex justify-between items-center">
                  <span>How do I delete my account?</span>
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 text-foreground/80 text-sm">
                  Go to Settings → Account → Delete Account. Your data will be permanently removed after 30 days.
                </div>
              </details>

              <details className="border-4 border-foreground p-4 cursor-pointer group">
                <summary className="font-bold flex justify-between items-center">
                  <span>Is there a web version?</span>
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 text-foreground/80 text-sm">
                  Yes! You're using it right now. THE V works on desktop, mobile browsers, and is available on iOS and Android.
                </div>
              </details>

              <div className="bg-foreground/5 border-4 border-foreground p-4 mt-6">
                <p className="font-bold mb-2">Still need help?</p>
                <p className="text-foreground/80 text-sm">
                  Email us at <span className="font-mono bg-foreground text-background px-2 py-1">support@thev.app</span>
                </p>
              </div>
            </div>
          )}

          {/* Legal Tab */}
          {activeTab === 'legal' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="border-4 border-foreground p-4">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Privacy Policy
                  </h4>
                  <p className="text-sm text-foreground/70 mb-3">
                    Learn how we collect, use, and protect your data.
                  </p>
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground font-bold underline text-sm"
                  >
                    Read Privacy Policy →
                  </a>
                </div>

                <div className="border-4 border-foreground p-4">
                  <h4 className="font-bold mb-2">Terms of Service</h4>
                  <p className="text-sm text-foreground/70 mb-3">
                    Understand the rules and guidelines for using THE V.
                  </p>
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground font-bold underline text-sm"
                  >
                    Read Terms of Service →
                  </a>
                </div>

                <div className="border-4 border-foreground p-4">
                  <h4 className="font-bold mb-2">Cookie Policy</h4>
                  <p className="text-sm text-foreground/70">
                    We use cookies to improve your experience. You can manage preferences in Settings.
                  </p>
                </div>
              </div>

              <div className="bg-foreground/10 border-4 border-foreground p-4">
                <p className="font-bold mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  More Information
                </p>
                <ul className="text-sm text-foreground/70 space-y-1">
                  <li>📧 Contact: support@thev.app</li>
                  <li>🌐 Website: www.thev.app</li>
                  <li>📱 Available on iOS and Android</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-4 border-foreground bg-foreground/5 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-foreground text-background font-bold border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Close
          </button>
          <a
            href="mailto:support@thev.app"
            className="flex-1 px-4 py-3 bg-background text-foreground font-bold border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};
