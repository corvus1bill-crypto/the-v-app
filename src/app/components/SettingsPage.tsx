import { useState, useEffect } from "react";
import { ArrowLeft, User, Bell, Lock, Eye, Heart, MessageSquare, Trash2, LogOut, ChevronRight, Sun, Moon, Palette, Check, Award, Sparkles, ShieldOff, Star, BarChart2 } from "lucide-react";
import { EditProfilePage } from "./EditProfilePage";
import { SavedPostsPage } from "./SavedPostsPage";
import { PrivacySettingsPage } from "./PrivacySettingsPage";
import { NewFeaturesPanel } from "./NewFeaturesPanel";
import { BlockedUsersPage } from "./BlockedUsersPage";
import { CloseFriendsPage } from "./CloseFriendsPage";

import { Post } from "../types";
import { projectId, publicAnonKey } from '../../../utils/supabase/info.tsx';

interface SettingsPageProps {
  onBack: () => void;
  onLogout: () => void;
  userProfile?: {
    name: string;
    username: string;
    bio: string;
    avatar: string;
  };
  onUpdateProfile?: (profile: { name: string; username: string; bio: string; avatar: string }) => void;
  savedPosts?: Post[];
  followedUsers?: Array<{ id: string; username: string; avatar: string }>;
  onNavigateToAnalytics?: () => void;
  currentUserId?: string;
}

export function SettingsPage({ onBack, onLogout, userProfile, onUpdateProfile, savedPosts = [], followedUsers = [], onNavigateToAnalytics, currentUserId }: SettingsPageProps) {
  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [theme, setTheme] = useState<'orange' | 'light' | 'dark' | 'red'>('orange');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [messageEnabled, setMessageEnabled] = useState(true);
  const [showSavedPosts, setShowSavedPosts] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showNewFeatures, setShowNewFeatures] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showCloseFriends, setShowCloseFriends] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    // Initialize theme from document class
    if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    } else if (document.documentElement.classList.contains('light')) {
      setTheme('light');
    } else if (document.documentElement.classList.contains('red')) {
      setTheme('red');
    } else {
      setTheme('orange');
    }
  }, []);

  const handleThemeChange = (newTheme: 'orange' | 'light' | 'dark' | 'red') => {
    setTheme(newTheme);
    document.documentElement.classList.remove('dark', 'light', 'red');
    if (newTheme !== 'orange') {
      document.documentElement.classList.add(newTheme);
    }
  };

  if (showEditProfile) {
    return (
      <EditProfilePage 
        onBack={() => setShowEditProfile(false)} 
        currentName={userProfile?.name}
        currentUsername={userProfile?.username}
        currentBio={userProfile?.bio}
        currentAvatar={userProfile?.avatar}
        onSave={(data) => {
           if (onUpdateProfile) {
             onUpdateProfile(data);
           }
           setShowEditProfile(false);
        }}
      />
    );
  }

  if (showSavedPosts) {
    return <SavedPostsPage onBack={() => setShowSavedPosts(false)} savedPosts={savedPosts} />;
  }

  if (showPrivacySettings) {
    return <PrivacySettingsPage onBack={() => setShowPrivacySettings(false)} />;
  }

  if (showNewFeatures) {
    return <NewFeaturesPanel onClose={() => setShowNewFeatures(false)} />;
  }

  if (showBlockedUsers) {
    return <BlockedUsersPage onBack={() => setShowBlockedUsers(false)} />;
  }

  if (showCloseFriends) {
    return <CloseFriendsPage onBack={() => setShowCloseFriends(false)} followedUsers={followedUsers} />;
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 z-40 bg-background border-b-4 border-foreground shadow-[0px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_10%,transparent)]" style={{
        paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
        paddingRight: 'calc(1rem + env(safe-area-inset-right))',
        paddingTop: '1rem',
        paddingBottom: '1rem'
      }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-background border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:scale-95"
          >
            <ArrowLeft className="text-foreground" size={20} strokeWidth={3} />
          </button>
          <h1 className="text-2xl font-black text-foreground uppercase italic tracking-tight"
            style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(.22,.68,0,1.2) both' }}>
            System Config
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 max-w-2xl mx-auto w-full" style={{
        paddingBottom: 'calc(80px + 1rem + env(safe-area-inset-bottom))'
      }}>
        {/* Account Section */}
        <div className="space-y-3" style={{ animation: 'springUp 0.45s cubic-bezier(.22,.68,0,1.2) 0ms both' }}>
          <h2 className="text-xs font-black text-foreground/50 uppercase tracking-widest px-1 border-l-4 border-background pl-2">USER ACCOUNT</h2>
          <div className="border-4 border-foreground bg-background shadow-[8px_8px_0px_0px_var(--foreground)]">
            <button 
              onClick={() => setShowEditProfile(true)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-background/10 transition-colors border-b-2 border-foreground group"
            >
              {userProfile?.avatar ? (
                <div className="w-12 h-12 border-2 border-foreground overflow-hidden bg-foreground shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                  <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-foreground border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)]">
                  <User className="text-background" size={24} />
                </div>
              )}
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-foreground uppercase">Edit Profile</p>
                <p className="text-xs font-mono font-bold text-foreground/50">UPDATE IDENTIFIER & ASSETS</p>
              </div>
              <ChevronRight className="text-foreground" size={20} strokeWidth={3} />
            </button>
            
            <button 
              onClick={() => setShowPrivacySettings(true)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-background/10 transition-colors border-b-2 border-foreground group"
            >
              <div className="w-12 h-12 bg-background border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                <Lock className="text-foreground" size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-foreground uppercase">Privacy & Security</p>
                <p className="text-xs font-mono font-bold text-foreground/50">ACCESS CONTROL</p>
              </div>
              <ChevronRight className="text-foreground" size={20} strokeWidth={3} />
            </button>

            <button 
              onClick={() => setShowCloseFriends(true)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-background/10 transition-colors border-b-2 border-foreground group"
            >
              <div className="w-12 h-12 bg-green-100 border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                <Star className="text-green-600" size={24} strokeWidth={0} fill="#16a34a" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-foreground uppercase">Close Friends</p>
                <p className="text-xs font-mono font-bold text-foreground/50">MANAGE YOUR INNER CIRCLE</p>
              </div>
              <ChevronRight className="text-foreground" size={20} strokeWidth={3} />
            </button>

            <button 
              onClick={() => setShowBlockedUsers(true)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-background/10 transition-colors group"
            >
              <div className="w-12 h-12 bg-background border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                <ShieldOff className="text-foreground" size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-foreground uppercase">Blocked Users</p>
                <p className="text-xs font-mono font-bold text-foreground/50">MANAGE RESTRICTIONS</p>
              </div>
              <ChevronRight className="text-foreground" size={20} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Creator Tools */}
        {onNavigateToAnalytics && (
          <div className="space-y-3" style={{ animation: 'springUp 0.45s cubic-bezier(.22,.68,0,1.2) 80ms both' }}>
            <h2 className="text-xs font-black text-foreground/50 uppercase tracking-widest px-1 border-l-4 border-background pl-2">CREATOR TOOLS</h2>
            <div className="border-4 border-foreground bg-background shadow-[8px_8px_0px_0px_var(--foreground)]">
              <button
                onClick={onNavigateToAnalytics}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-background/10 transition-colors group"
              >
                <div className="w-12 h-12 bg-foreground border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                  <BarChart2 className="text-background" size={24} strokeWidth={2.5} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-black text-sm text-foreground uppercase">Creator Analytics</p>
                  <p className="text-xs font-mono font-bold text-foreground/50">VIEWS • REACH • GROWTH</p>
                </div>
                <ChevronRight className="text-foreground" size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

        {/* New Features Section */}
        

        {/* Notifications Section */}
        <div className="space-y-3" style={{ animation: 'springUp 0.45s cubic-bezier(.22,.68,0,1.2) 160ms both' }}>
          <h2 className="text-xs font-black text-foreground/50 uppercase tracking-widest px-1 border-l-4 border-background pl-2">NOTIFICATIONS</h2>
          <div className="border-4 border-foreground bg-background shadow-[8px_8px_0px_0px_var(--foreground)]">
            <button 
              onClick={() => setPushEnabled(!pushEnabled)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-background/10 transition-colors border-b-2 border-foreground group"
            >
              <div className="w-12 h-12 bg-background border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                <Bell className="text-foreground" size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-foreground uppercase">Push Alerts</p>
                <p className="text-xs font-mono font-bold text-foreground/50">STATUS: {pushEnabled ? 'ACTIVE' : 'INACTIVE'}</p>
              </div>
              <div className={`w-14 h-8 border-2 border-foreground flex items-center px-1 transition-colors ${pushEnabled ? 'bg-background' : 'bg-secondary'}`}>
                <div className={`w-5 h-5 border-2 border-foreground bg-card shadow-[1px_1px_0px_0px_var(--foreground)] transition-all ${pushEnabled ? 'ml-auto' : ''}`} />
              </div>
            </button>
            
            <button 
              onClick={() => setMessageEnabled(!messageEnabled)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-background/10 transition-colors group"
            >
              <div className="w-12 h-12 bg-background border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                <MessageSquare className="text-foreground" size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-foreground uppercase">Message Alerts</p>
                <p className="text-xs font-mono font-bold text-foreground/50">STATUS: {messageEnabled ? 'ACTIVE' : 'INACTIVE'}</p>
              </div>
              <div className={`w-14 h-8 border-2 border-foreground flex items-center px-1 transition-colors ${messageEnabled ? 'bg-background' : 'bg-secondary'}`}>
                <div className={`w-5 h-5 border-2 border-foreground bg-card shadow-[1px_1px_0px_0px_var(--foreground)] transition-all ${messageEnabled ? 'ml-auto' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="space-y-3" style={{ animation: 'springUp 0.45s cubic-bezier(.22,.68,0,1.2) 240ms both' }}>
          <h2 className="text-xs font-black text-foreground/50 uppercase tracking-widest px-1 border-l-4 border-background pl-2">SYSTEM PREFERENCES</h2>
          <div className="border-4 border-foreground bg-background shadow-[8px_8px_0px_0px_var(--foreground)]">
            <div className="border-b-2 border-foreground">
              <button 
                onClick={() => setShowThemeOptions(!showThemeOptions)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-background/10 transition-colors group"
              >
                <div className="w-12 h-12 bg-background border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                  <Eye className="text-foreground" size={24} strokeWidth={2.5} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-black text-sm text-foreground uppercase">Appearance Mode</p>
                  <p className="text-xs font-mono font-bold text-foreground/50">CURRENT: {theme.toUpperCase()}</p>
                </div>
                <ChevronRight className={`text-foreground transition-transform ${showThemeOptions ? 'rotate-90' : ''}`} size={20} strokeWidth={3} />
              </button>
              
              {showThemeOptions && (
                 <div className="px-5 pb-4 space-y-2 bg-foreground/5 border-t-2 border-foreground">
                    <button onClick={() => handleThemeChange('light')} className={`w-full flex items-center gap-3 p-3 border-2 border-foreground transition-all ${theme === 'light' ? 'bg-white shadow-[2px_2px_0px_0px_var(--foreground)]' : 'bg-transparent hover:bg-white/50'}`}>
                      <div className="w-8 h-8 rounded-full bg-white border-2 border-foreground flex items-center justify-center">
                        <Sun size={14} className="text-black" />
                      </div>
                      <span className="flex-1 text-left text-sm font-black uppercase">Light</span>
                      {theme === 'light' && <Check size={20} className="text-foreground" strokeWidth={3} />}
                    </button>

                    <button onClick={() => handleThemeChange('dark')} className={`w-full flex items-center gap-3 p-3 border-2 border-foreground transition-all ${theme === 'dark' ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]' : 'bg-transparent hover:bg-black/10'}`}>
                      <div className="w-8 h-8 rounded-full bg-black border-2 border-gray-600 flex items-center justify-center">
                        <Moon size={14} className="text-white" />
                      </div>
                      <span className="flex-1 text-left text-sm font-black uppercase">Dark</span>
                      {theme === 'dark' && <Check size={20} className="text-white" strokeWidth={3} />}
                    </button>

                    <button onClick={() => handleThemeChange('orange')} className={`w-full flex items-center gap-3 p-3 border-2 border-foreground transition-all ${theme === 'orange' ? 'bg-background shadow-[2px_2px_0px_0px_var(--foreground)]' : 'bg-transparent hover:bg-background/50'}`}>
                      <div className="w-8 h-8 rounded-full bg-background border-2 border-foreground flex items-center justify-center">
                        <Palette size={14} className="text-foreground" />
                      </div>
                      <span className="flex-1 text-left text-sm font-black uppercase">Original Orange</span>
                      {theme === 'orange' && <Check size={20} className="text-foreground" strokeWidth={3} />}
                    </button>

                    <button type="button" onClick={() => handleThemeChange('red')} className={`w-full flex items-center gap-3 p-3 border-2 border-foreground transition-all ${theme === 'red' ? 'bg-red-600 shadow-[2px_2px_0px_0px_var(--foreground)]' : 'bg-transparent hover:bg-red-600/50'}`}>
                      <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-foreground flex items-center justify-center">
                        <Palette size={14} className="text-white" />
                      </div>
                      <span className="flex-1 text-left text-sm font-black uppercase">Industrial Red</span>
                      {theme === 'red' && <Check size={20} className="text-black" strokeWidth={3} />}
                    </button>
                 </div>
              )}
            </div>
            
            <button 
              onClick={() => setShowSavedPosts(true)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-background/10 transition-colors group"
            >
              <div className="w-12 h-12 bg-background border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                <Heart className="text-foreground" size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-foreground uppercase">Saved Data</p>
                <p className="text-xs font-mono font-bold text-foreground/50">ARCHIVED CONTENT</p>
              </div>
              <ChevronRight className="text-foreground" size={20} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="space-y-3" style={{ animation: 'springUp 0.45s cubic-bezier(.22,.68,0,1.2) 320ms both' }}>
          <h2 className="text-xs font-black text-red-600 uppercase tracking-widest px-1 border-l-4 border-red-600 pl-2">DANGER ZONE</h2>
          <div className="border-4 border-red-600 bg-background shadow-[8px_8px_0px_0px_rgba(220,38,38,1)]">
            <button 
              onClick={() => {
                if (confirm('Reset all badge progress? This will allow you to earn badges again.')) {
                  localStorage.removeItem('earnedBadges');
                  alert('Badge progress reset! Refresh the page to start earning badges again.');
                }
              }}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-orange-50 transition-colors border-b-2 border-red-600 group"
            >
              <div className="w-12 h-12 bg-background border-2 border-background flex items-center justify-center shadow-[2px_2px_0px_0px_var(--background)] group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                <Award className="text-background" size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-background uppercase">Reset Badges</p>
                <p className="text-xs font-mono font-bold text-orange-400">RE-EARN ALL ACHIEVEMENTS</p>
              </div>
              <ChevronRight className="text-background" size={20} strokeWidth={3} />
            </button>

            <button
              onClick={() => setShowDeleteAccountConfirm(true)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 transition-colors border-b-2 border-red-600 group"
            >
              <div className="w-12 h-12 bg-background border-2 border-red-600 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                <Trash2 className="text-red-600" size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-red-600 uppercase">Delete Account</p>
                <p className="text-xs font-mono font-bold text-red-400">IRREVERSIBLE ACTION</p>
              </div>
              <ChevronRight className="text-red-600" size={20} strokeWidth={3} />
            </button>
            
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 transition-colors group"
            >
              <div className="w-12 h-12 bg-background border-2 border-red-600 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                <LogOut className="text-red-600" size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-red-600 uppercase">Log Out</p>
                <p className="text-xs font-mono font-bold text-red-400">TERMINATE SESSION</p>
              </div>
              <ChevronRight className="text-red-600" size={20} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center py-6 border-t-4 border-foreground/10"
          style={{ animation: 'springUp 0.45s cubic-bezier(.22,.68,0,1.2) 400ms both' }}>
          <p className="text-sm font-black text-foreground mb-1 uppercase">VIBE SOCIAL v1.0.0</p>
          <p className="text-xs font-mono font-bold text-foreground/50">WIP BUILD • DO NOT DISTRIBUTE</p>
          <div className="mt-2 flex justify-center gap-1">
            {['var(--background)', '#000', 'var(--background)', '#000', 'var(--background)'].map((color, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, animation: `statusPulse 2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteAccountConfirm && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={() => setShowDeleteAccountConfirm(false)}>
          <div
            className="w-[340px] bg-card border-4 border-red-600 shadow-[8px_8px_0px_0px_rgba(220,38,38,1)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500 border-2 border-foreground flex items-center justify-center">
                <Trash2 size={24} className="text-white" strokeWidth={3} />
              </div>
              <div>
                <h3 className="font-black text-lg uppercase text-red-600">Delete Account?</h3>
                <p className="text-[10px] font-mono font-bold text-red-400 uppercase">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm font-bold text-foreground/70 mb-2">
              This will permanently delete:
            </p>
            <ul className="text-xs font-mono font-bold text-foreground/60 space-y-1 mb-6 pl-4">
              <li>• All your posts and stories</li>
              <li>• Your profile and bio</li>
              <li>• All earned badges and stats</li>
              <li>• Your followers and following list</li>
              <li>• All saved content and messages</li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAccountConfirm(false)}
                className="flex-1 py-2.5 px-4 font-black uppercase text-sm border-2 border-foreground text-foreground bg-card shadow-[3px_3px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!currentUserId) {
                    setShowDeleteAccountConfirm(false);
                    localStorage.clear();
                    onLogout();
                    return;
                  }
                  setIsDeletingAccount(true);
                  try {
                    await fetch(
                      `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/users/${currentUserId}/account`,
                      { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
                    );
                  } catch (e) {
                    console.error('Account deletion error:', e);
                  } finally {
                    setIsDeletingAccount(false);
                    setShowDeleteAccountConfirm(false);
                    localStorage.clear();
                    onLogout();
                  }
                }}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 px-4 font-black uppercase text-sm border-2 border-foreground text-white bg-red-600 shadow-[3px_3px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeletingAccount ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deleting...</>
                ) : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}