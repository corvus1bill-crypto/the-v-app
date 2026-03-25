import { useState } from "react";
import { ArrowLeft, Lock, Eye, MessageSquare, Shield, UserX, AlertTriangle, Check } from "lucide-react";

interface PrivacySettingsPageProps {
  onBack: () => void;
}

export function PrivacySettingsPage({ onBack }: PrivacySettingsPageProps) {
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  return (
    <div className="h-full flex flex-col bg-card"
      style={{ animation: 'pageSlideIn 0.35s cubic-bezier(.22,.68,0,1.2) both' }}>
      {/* Header */}
      <div className="shrink-0 z-40 bg-background border-b-4 border-foreground px-4 py-4 shadow-[0px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-card border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:scale-95"
          >
            <ArrowLeft className="text-foreground" size={20} strokeWidth={3} />
          </button>
          <h1 className="text-2xl font-black text-foreground uppercase italic tracking-tight">
            Privacy & Security
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 max-w-2xl mx-auto w-full">
        {/* Account Privacy */}
        <div className="space-y-3">
          <h2 className="text-xs font-black text-foreground/50 uppercase tracking-widest px-1 border-l-4 border-background pl-2">ACCOUNT PRIVACY</h2>
          <div className="border-4 border-foreground bg-card shadow-[8px_8px_0px_0px_var(--foreground)]">
            <button 
              onClick={() => setIsPrivate(!isPrivate)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-background/10 transition-colors group"
            >
              <div className="w-12 h-12 bg-card border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                <Lock className="text-foreground" size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-foreground uppercase">Private Account</p>
                <p className="text-xs font-mono font-bold text-foreground/50">{isPrivate ? 'ENABLED: FOLLOW REQUESTS REQUIRED' : 'DISABLED: PUBLIC PROFILE'}</p>
              </div>
              <div className={`w-14 h-8 border-2 border-foreground flex items-center px-1 transition-colors ${isPrivate ? 'bg-background' : 'bg-secondary'}`}>
                <div className={`w-5 h-5 border-2 border-foreground bg-card shadow-[1px_1px_0px_0px_var(--foreground)] transition-all ${isPrivate ? 'ml-auto' : ''}`} />
              </div>
            </button>
          </div>
          <p className="text-xs font-mono text-foreground/60 px-1">
            When your account is private, only people you approve can see your photos and videos. Your existing followers won't be affected.
          </p>
        </div>

        {/* Interactions */}
        <div className="space-y-3">
          <h2 className="text-xs font-black text-foreground/50 uppercase tracking-widest px-1 border-l-4 border-background pl-2">INTERACTIONS</h2>
          <div className="border-4 border-foreground bg-card shadow-[8px_8px_0px_0px_var(--foreground)]">
            <button 
              onClick={() => setAllowComments(!allowComments)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-background/10 transition-colors border-b-2 border-foreground group"
            >
              <div className="w-12 h-12 bg-card border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                <MessageSquare className="text-foreground" size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-foreground uppercase">Allow Comments</p>
                <p className="text-xs font-mono font-bold text-foreground/50">{allowComments ? 'EVERYONE' : 'FOLLOWERS ONLY'}</p>
              </div>
              <div className={`w-14 h-8 border-2 border-foreground flex items-center px-1 transition-colors ${allowComments ? 'bg-background' : 'bg-secondary'}`}>
                <div className={`w-5 h-5 border-2 border-foreground bg-card shadow-[1px_1px_0px_0px_var(--foreground)] transition-all ${allowComments ? 'ml-auto' : ''}`} />
              </div>
            </button>

            <button 
              onClick={() => setShowActivity(!showActivity)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-background/10 transition-colors group"
            >
              <div className="w-12 h-12 bg-card border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                <Eye className="text-foreground" size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-foreground uppercase">Activity Status</p>
                <p className="text-xs font-mono font-bold text-foreground/50">{showActivity ? 'VISIBLE' : 'HIDDEN'}</p>
              </div>
              <div className={`w-14 h-8 border-2 border-foreground flex items-center px-1 transition-colors ${showActivity ? 'bg-background' : 'bg-secondary'}`}>
                <div className={`w-5 h-5 border-2 border-foreground bg-card shadow-[1px_1px_0px_0px_var(--foreground)] transition-all ${showActivity ? 'ml-auto' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="space-y-3">
          <h2 className="text-xs font-black text-foreground/50 uppercase tracking-widest px-1 border-l-4 border-background pl-2">SECURITY & DATA</h2>
          <div className="border-4 border-foreground bg-card shadow-[8px_8px_0px_0px_var(--foreground)]">
            <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-background/10 transition-colors border-b-2 border-foreground group">
              <div className="w-12 h-12 bg-card border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                <UserX className="text-foreground" size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-foreground uppercase">Blocked Accounts</p>
                <p className="text-xs font-mono font-bold text-foreground/50">0 ACCOUNTS</p>
              </div>
              <div className="w-8 h-8 flex items-center justify-center bg-foreground text-background font-mono text-xs font-bold border-2 border-foreground">
                0
              </div>
            </button>

            <button 
              onClick={() => setDataSharing(!dataSharing)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-background/10 transition-colors group"
            >
              <div className="w-12 h-12 bg-card border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                <Shield className="text-foreground" size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-foreground uppercase">Data Sharing</p>
                <p className="text-xs font-mono font-bold text-foreground/50">{dataSharing ? 'ENABLED' : 'DISABLED'}</p>
              </div>
              <div className={`w-14 h-8 border-2 border-foreground flex items-center px-1 transition-colors ${dataSharing ? 'bg-background' : 'bg-secondary'}`}>
                <div className={`w-5 h-5 border-2 border-foreground bg-card shadow-[1px_1px_0px_0px_var(--foreground)] transition-all ${dataSharing ? 'ml-auto' : ''}`} />
              </div>
            </button>
          </div>
          <div className="flex gap-2 items-start px-1 pt-2">
             <AlertTriangle size={16} className="text-foreground shrink-0 mt-0.5" />
             <p className="text-xs font-mono text-foreground/60">
               Data sharing helps us improve your experience. We never sell your personal data to third parties.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
