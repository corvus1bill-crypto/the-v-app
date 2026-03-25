import { Plus, Play } from 'lucide-react';
import { StoryHighlight } from '../types';

interface StoryHighlightsViewProps {
  highlights: StoryHighlight[];
  onViewHighlight: (highlight: StoryHighlight) => void;
  onCreateHighlight?: () => void;
  canEdit?: boolean;
}

export function StoryHighlightsView({ highlights, onViewHighlight, onCreateHighlight, canEdit }: StoryHighlightsViewProps) {
  if (highlights.length === 0 && !canEdit) return null;

  return (
    <div className="px-6 py-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-1 flex-1 bg-black"></div>
        <span className="text-xs font-black uppercase opacity-60">Story Highlights</span>
        <div className="h-1 flex-1 bg-black"></div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
        {/* Create New Highlight (only for own profile) */}
        {canEdit && (
          <button
            onClick={onCreateHighlight}
            className="flex-shrink-0 flex flex-col items-center gap-2 group"
          >
            <div className="w-20 h-20 border-4 border-black bg-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={32} strokeWidth={3} />
            </div>
            <span className="text-xs font-black uppercase">New</span>
          </button>
        )}

        {/* Existing Highlights */}
        {highlights.map((highlight) => (
          <button
            key={highlight.id}
            onClick={() => onViewHighlight(highlight)}
            className="flex-shrink-0 flex flex-col items-center gap-2 group"
          >
            <div className="relative w-20 h-20 border-4 border-black overflow-hidden group-hover:scale-110 transition-transform">
              <img
                src={highlight.coverImage}
                alt={highlight.name}
                className="w-full h-full object-cover"
              />
              {/* Play Icon Overlay */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play size={24} fill="white" strokeWidth={0} />
              </div>
            </div>
            <span className="text-xs font-black uppercase max-w-[80px] truncate">
              {highlight.name}
            </span>
          </button>
        ))}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
