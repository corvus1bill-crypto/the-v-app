import { X, Eye } from 'lucide-react';

interface StoryViewsModalProps {
  storyId: string;
  viewerIds: string[];
  onClose: () => void;
}

// Mock viewer data - in real app this would come from backend
const MOCK_VIEWERS = [
  { id: 'user1', username: 'TravelDreamer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', timestamp: '2m ago' },
  { id: 'user2', username: 'FoodieHeaven', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop', timestamp: '5m ago' },
  { id: 'user3', username: 'UrbanExplorer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', timestamp: '12m ago' },
  { id: 'user4', username: 'NaturePhotos', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', timestamp: '23m ago' },
  { id: 'user5', username: 'PortraitPro', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop', timestamp: '1h ago' },
];

export function StoryViewsModal({ storyId, viewerIds, onClose }: StoryViewsModalProps) {
  const viewers = MOCK_VIEWERS.slice(0, Math.max(viewerIds.length, 3));

  return (
    <div className="absolute inset-0 z-[100] flex items-end justify-center bg-black/80 animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-background rounded-t-3xl shadow-2xl border-4 border-black animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <div>
            <h2 className="text-2xl font-black uppercase flex items-center gap-2">
              <Eye size={24} strokeWidth={3} />
              Story Views
            </h2>
            <p className="text-sm opacity-60 font-bold mt-1">
              {viewers.length} {viewers.length === 1 ? 'view' : 'views'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-black text-background rounded-lg hover:scale-110 active:scale-95 transition-transform"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Viewers List */}
        <div className="p-6 space-y-2 max-h-[60%] overflow-y-auto">
          {viewers.map((viewer, index) => (
            <div
              key={viewer.id}
              className="flex items-center justify-between p-4 bg-white border-4 border-black hover:translate-x-1 hover:-translate-y-1 transition-transform"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex items-center gap-3">
                <img
                  src={viewer.avatar}
                  alt={viewer.username}
                  className="w-12 h-12 border-4 border-black object-cover"
                />
                <div>
                  <div className="font-black uppercase">{viewer.username}</div>
                  <div className="text-xs font-bold opacity-60">@{viewer.username.toLowerCase()}</div>
                </div>
              </div>
              <div className="text-xs font-bold opacity-60">{viewer.timestamp}</div>
            </div>
          ))}

          {viewers.length === 0 && (
            <div className="text-center py-12">
              <Eye size={48} strokeWidth={3} className="mx-auto mb-4 opacity-20" />
              <p className="font-black uppercase opacity-40">No views yet</p>
              <p className="text-sm font-bold opacity-30 mt-2">Be the first to share your story!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t-4 border-black">
          <button
            onClick={onClose}
            className="w-full py-4 bg-black text-background font-black uppercase border-4 border-black hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}