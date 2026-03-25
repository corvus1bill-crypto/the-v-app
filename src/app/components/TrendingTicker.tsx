const TRENDING = [
  '#mountainvibes', '#citylights', '#foodie', '#goldenhourglow',
  '#streetphotography', '#urbanart', '#traveldreams', '#fitnesslife',
  '#architectureporn', '#portraitphotography', '#naturelover', '#vibecheck',
  '#nightphotography', '#minimalism', '#sunsetshots', '#coffeetime',
];

export function TrendingTicker({ onTagClick }: { onTagClick?: (tag: string) => void }) {
  const doubled = [...TRENDING, ...TRENDING];

  return (
    <div className="overflow-hidden bg-foreground border-b-4 border-foreground py-1.5 relative">
      {/* Label */}
      <span className="absolute left-0 top-0 bottom-0 flex items-center px-2 bg-background border-r-4 border-foreground z-10">
        <span className="text-[9px] font-black text-foreground uppercase tracking-widest whitespace-nowrap"
          style={{ animation: 'typingPulse 2s ease-in-out infinite' }}>TRENDING</span>
      </span>

      <div
        className="flex gap-4 items-center"
        style={{
          paddingLeft: '80px',
          animation: 'tickerScroll 30s linear infinite',
          whiteSpace: 'nowrap',
        }}
      >
        {doubled.map((tag, i) => (
          <span key={i} className="text-[11px] font-black text-background/80 hover:text-background cursor-pointer transition-colors select-none" onClick={() => onTagClick?.(tag)}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}