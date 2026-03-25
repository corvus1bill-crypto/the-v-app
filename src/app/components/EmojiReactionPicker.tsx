import { useEffect, useRef } from 'react';

const REACTIONS = ['❤️', '🔥', '😂', '😮', '😢', '👏'];

interface EmojiReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  activeReaction?: string;
}

export function EmojiReactionPicker({ onSelect, onClose, activeReaction }: EmojiReactionPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 z-50"
      style={{ animation: 'scaleIn 0.18s cubic-bezier(.22,.68,0,1.3) both' }}
    >
      <div className="flex gap-1 bg-card border-2 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] px-2 py-1.5">
        {REACTIONS.map((emoji, i) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className={`text-xl transition-all hover:scale-125 active:scale-95 ${activeReaction === emoji ? 'scale-125 -translate-y-1' : ''}`}
            style={{ animationDelay: `${i * 30}ms`, animation: `fadeSlideUp 0.2s ease ${i * 30}ms both` }}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
      {/* Arrow */}
      <div className="w-3 h-3 bg-card border-r-2 border-b-2 border-foreground rotate-45 ml-3 -mt-[7px] relative z-10" />
    </div>
  );
}