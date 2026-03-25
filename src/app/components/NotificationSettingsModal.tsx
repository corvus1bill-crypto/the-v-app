import { X } from 'lucide-react';
import { NotificationSettings } from '../types';

interface NotificationSettingsModalProps {
  settings: NotificationSettings;
  onUpdate: (key: keyof NotificationSettings, value: boolean) => void;
  onClose: () => void;
}

export function NotificationSettingsModal({ settings, onUpdate, onClose }: NotificationSettingsModalProps) {
  const settingsConfig = [
    { key: 'likes' as const, label: 'Likes', icon: '❤️', description: 'When someone likes your post' },
    { key: 'comments' as const, label: 'Comments', icon: '💬', description: 'When someone comments on your post' },
    { key: 'follows' as const, label: 'Follows', icon: '👥', description: 'When someone follows you' },
    { key: 'messages' as const, label: 'Messages', icon: '✉️', description: 'When you receive a message' },
    { key: 'mentions' as const, label: 'Mentions', icon: '@', description: 'When someone mentions you' },
    { key: 'posts' as const, label: 'Posts', icon: '📸', description: 'When people you follow post' },
  ];

  return (
    <div className="absolute inset-0 z-[100] flex items-end justify-center bg-black/80 animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-background rounded-t-3xl shadow-2xl border-4 border-black animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <div>
            <h2 className="text-2xl font-black uppercase">Notifications</h2>
            <p className="text-sm opacity-60 font-bold mt-1">Customize your alerts</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-black text-background rounded-lg hover:scale-110 active:scale-95 transition-transform"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Settings List */}
        <div className="p-6 space-y-1 max-h-[70%] overflow-y-auto">
          {settingsConfig.map((config) => (
            <div
              key={config.key}
              className="flex items-center justify-between p-4 bg-white/50 hover:bg-white/80 border-4 border-black transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{config.icon}</span>
                <div>
                  <div className="font-black uppercase text-sm">{config.label}</div>
                  <div className="text-xs opacity-60 font-bold">{config.description}</div>
                </div>
              </div>
              
              {/* Toggle Switch */}
              <button
                onClick={() => onUpdate(config.key, !settings[config.key])}
                className={`relative w-14 h-8 border-4 border-black transition-colors ${
                  settings[config.key] ? 'bg-black' : 'bg-white'
                }`}
              >
                <div
                  className={`absolute top-0 bottom-0 w-6 bg-background border-2 border-black transition-transform ${
                    settings[config.key] ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t-4 border-black">
          <button
            onClick={onClose}
            className="w-full py-4 bg-black text-background font-black uppercase border-4 border-black hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}