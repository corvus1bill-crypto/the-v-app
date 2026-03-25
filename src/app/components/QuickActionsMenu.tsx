import { 
  X, FileText, Calendar, Hash, Image, Sparkles, 
  BarChart, Archive, Bell, Ban 
} from 'lucide-react';

interface QuickActionsMenuProps {
  onSelectAction: (action: string) => void;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { id: 'drafts', icon: FileText, label: 'Drafts', color: 'bg-blue-500' },
  { id: 'schedule', icon: Calendar, label: 'Schedule', color: 'bg-purple-500' },
  { id: 'hashtags', icon: Hash, label: 'Hashtags', color: 'bg-green-500' },
  { id: 'filters', icon: Image, label: 'Filters', color: 'bg-pink-500' },
  { id: 'templates', icon: Sparkles, label: 'Templates', color: 'bg-yellow-500' },
  { id: 'insights', icon: BarChart, label: 'Insights', color: 'bg-indigo-500' },
  { id: 'archive', icon: Archive, label: 'Archive', color: 'bg-gray-500' },
  { id: 'notifications', icon: Bell, label: 'Notifications', color: 'bg-red-500' },
  { id: 'privacy', icon: Ban, label: 'Privacy', color: 'bg-orange-500' },
];

export function QuickActionsMenu({ onSelectAction, onClose }: QuickActionsMenuProps) {
  return (
    <div 
      className="absolute inset-0 z-[100] bg-black/80 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl border-4 border-black animate-in slide-in-from-bottom duration-300 max-w-[430px] mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <div>
            <h2 className="text-2xl font-black uppercase">Quick Actions</h2>
            <p className="text-sm opacity-60 font-bold mt-1">Access new features</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-black text-background rounded-lg hover:scale-110 active:scale-95 transition-transform"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Actions Grid */}
        <div className="p-6 grid grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => {
                  onSelectAction(action.id);
                  onClose();
                }}
                className="flex flex-col items-center gap-2 p-4 bg-white border-4 border-black hover:translate-x-1 hover:-translate-y-1 transition-transform"
                style={{ animation: `springUp 0.4s cubic-bezier(.22,.68,0,1.2) ${index * 40}ms both` }}
              >
                <div className={`w-12 h-12 ${action.color} border-4 border-black flex items-center justify-center`}>
                  <Icon size={24} strokeWidth={3} className="text-white" />
                </div>
                <span className="text-xs font-black uppercase text-center">{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
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