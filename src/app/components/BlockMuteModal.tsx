import { X, Ban, VolumeX, AlertTriangle } from 'lucide-react';

interface BlockMuteModalProps {
  userId: string;
  username: string;
  userAvatar: string;
  isBlocked: boolean;
  isMuted: boolean;
  onBlock: () => void;
  onUnblock: () => void;
  onMute: () => void;
  onUnmute: () => void;
  onClose: () => void;
}

export function BlockMuteModal({
  userId,
  username,
  userAvatar,
  isBlocked,
  isMuted,
  onBlock,
  onUnblock,
  onMute,
  onUnmute,
  onClose,
}: BlockMuteModalProps) {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 animate-in fade-in duration-200 p-6">
      <div className="w-full max-w-[380px] bg-background rounded-lg shadow-2xl border-4 border-foreground animate-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b-4 border-foreground">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black uppercase flex items-center gap-2">
              <AlertTriangle size={20} strokeWidth={3} />
              Privacy Options
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-foreground text-background rounded-lg hover:scale-110 active:scale-95 transition-transform"
            >
              <X size={16} strokeWidth={3} />
            </button>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <img
              src={userAvatar}
              alt={username}
              className="w-12 h-12 border-4 border-foreground object-cover"
            />
            <div>
              <div className="font-black uppercase">{username}</div>
              <div className="text-xs font-bold opacity-60">@{username.toLowerCase()}</div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3">
          {/* Mute Option */}
          <button
            onClick={() => {
              if (isMuted) {
                onUnmute();
              } else {
                onMute();
              }
              onClose();
            }}
            className={`w-full p-4 border-4 border-foreground flex items-center gap-3 hover:translate-x-1 hover:-translate-y-1 transition-transform ${
              isMuted ? 'bg-yellow-500 text-foreground' : 'bg-card'
            }`}
          >
            <VolumeX size={24} strokeWidth={3} />
            <div className="flex-1 text-left">
              <div className="font-black uppercase text-sm">
                {isMuted ? 'Unmute' : 'Mute'} @{username}
              </div>
              <div className="text-xs font-bold opacity-60">
                {isMuted
                  ? 'Start seeing their posts again'
                  : "Hide their posts from your feed"}
              </div>
            </div>
          </button>

          {/* Block Option */}
          <button
            onClick={() => {
              if (isBlocked) {
                onUnblock();
              } else {
                onBlock();
              }
              onClose();
            }}
            className={`w-full p-4 border-4 border-foreground flex items-center gap-3 hover:translate-x-1 hover:-translate-y-1 transition-transform ${
              isBlocked ? 'bg-red-500 text-white' : 'bg-card'
            }`}
          >
            <Ban size={24} strokeWidth={3} />
            <div className="flex-1 text-left">
              <div className="font-black uppercase text-sm">
                {isBlocked ? 'Unblock' : 'Block'} @{username}
              </div>
              <div className="text-xs font-bold opacity-60">
                {isBlocked
                  ? 'Allow them to see your content'
                  : "They won't be able to find your profile"}
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-foreground text-background font-black uppercase border-4 border-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}