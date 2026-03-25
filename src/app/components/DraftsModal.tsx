import { X, FileText, Clock, Trash2, Send } from 'lucide-react';
import { DraftPost } from '../types';

interface DraftsModalProps {
  drafts: DraftPost[];
  onLoadDraft: (draft: DraftPost) => void;
  onDeleteDraft: (draftId: string) => void;
  onClose: () => void;
}

export function DraftsModal({ drafts, onLoadDraft, onDeleteDraft, onClose }: DraftsModalProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-end justify-center bg-black/80 animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-background rounded-t-3xl shadow-2xl border-4 border-foreground animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-4 border-foreground">
          <div>
            <h2 className="text-2xl font-black uppercase">Drafts</h2>
            <p className="text-sm opacity-60 font-bold mt-1">{drafts.length} saved drafts</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-foreground text-background rounded-lg hover:scale-110 active:scale-95 transition-transform"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Drafts List */}
        <div className="p-6 space-y-3 max-h-[70%] overflow-y-auto">
          {drafts.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} strokeWidth={3} className="mx-auto mb-4 opacity-20" />
              <p className="font-black uppercase opacity-40">No drafts yet</p>
              <p className="text-sm font-bold opacity-30 mt-2">Start creating a post and it will auto-save</p>
            </div>
          ) : (
            drafts.map((draft, index) => (
              <div
                key={draft.id}
                className="p-4 bg-card border-4 border-foreground hover:translate-x-1 hover:-translate-y-1 transition-transform"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  {draft.content.imageUrl && (
                    <div className="w-16 h-16 border-4 border-foreground overflow-hidden flex-shrink-0">
                      <img 
                        src={draft.content.imageUrl} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm line-clamp-2 mb-2">
                      {draft.content.caption || 'Untitled draft'}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold opacity-60">
                      <Clock size={12} strokeWidth={3} />
                      {formatDate(draft.lastSaved)}
                      {draft.autoSaved && <span className="text-[10px] opacity-40">(Auto-saved)</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => onLoadDraft(draft)}
                      className="w-10 h-10 flex items-center justify-center bg-foreground text-background border-2 border-foreground hover:scale-110 active:scale-95 transition-transform"
                      title="Load draft"
                    >
                      <Send size={16} strokeWidth={3} />
                    </button>
                    <button
                      onClick={() => onDeleteDraft(draft.id)}
                      className="w-10 h-10 flex items-center justify-center bg-red-500 text-white border-2 border-foreground hover:scale-110 active:scale-95 transition-transform"
                      title="Delete draft"
                    >
                      <Trash2 size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t-4 border-foreground">
          <button
            onClick={onClose}
            className="w-full py-4 bg-foreground text-background font-black uppercase border-4 border-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}