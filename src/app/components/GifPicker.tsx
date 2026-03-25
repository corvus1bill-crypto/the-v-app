import { X, Search, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface GifPickerProps {
  onSelectGif: (gifUrl: string) => void;
  onClose: () => void;
}

// Mock GIFs - in real app would use GIPHY API
const TRENDING_GIFS = [
  'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
  'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
  'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif',
  'https://media.giphy.com/media/l0HlQXlQ3nHyLMvte/giphy.gif',
  'https://media.giphy.com/media/3oEjHWPTo7c0ajPwty/giphy.gif',
];

export function GifPicker({ onSelectGif, onClose }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="absolute inset-0 z-[100] flex items-end justify-center bg-black/80 animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-background rounded-t-3xl shadow-2xl border-4 border-black animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-6 border-b-4 border-black">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black uppercase">GIF Picker</h2>
              <p className="text-sm opacity-60 font-bold mt-1">Add some motion</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-black text-background rounded-lg hover:scale-110 active:scale-95 transition-transform"
            >
              <X size={20} strokeWidth={3} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={20} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search GIFs..."
              className="w-full py-3 pl-12 pr-4 border-4 border-black font-bold uppercase text-sm focus:outline-none focus:ring-4 focus:ring-black/20"
            />
          </div>
        </div>

        {/* GIF Grid */}
        <div className="p-6 max-h-[60%] overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} strokeWidth={3} />
            <span className="text-xs font-black uppercase opacity-60">Trending</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {TRENDING_GIFS.map((gif, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelectGif(gif);
                  onClose();
                }}
                className="aspect-square border-4 border-black overflow-hidden hover:scale-105 active:scale-95 transition-transform"
              >
                <img
                  src={gif}
                  alt="GIF"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Powered by GIPHY */}
          <div className="mt-6 text-center">
            <p className="text-xs font-bold opacity-40">Powered by GIPHY</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-4 border-black">
          <button
            onClick={onClose}
            className="w-full py-4 bg-black text-background font-black uppercase border-4 border-black hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}