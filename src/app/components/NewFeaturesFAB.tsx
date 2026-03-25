import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { NewFeaturesPanel } from './NewFeaturesPanel';

export function NewFeaturesFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-28 right-6 z-50 w-16 h-16 bg-gradient-to-br from-background to-orange-400 border-4 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 transition-all group animate-bounce"
        style={{ animation: 'bounce 2s infinite' }}
      >
        <Sparkles size={28} strokeWidth={3} className="text-black group-hover:scale-110 transition-transform animate-pulse" />
        
        {/* Badge */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 border-2 border-black rounded-full flex items-center justify-center text-xs font-black text-white">
          20
        </div>

        {/* Dismiss button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDismissed(true);
          }}
          className="absolute -top-1 -left-1 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-2 border-black"
        >
          <X size={12} strokeWidth={3} />
        </button>
      </button>

      {/* Tooltip */}
      <div className="absolute bottom-28 right-24 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-black text-white px-3 py-2 font-black uppercase text-xs border-2 border-black whitespace-nowrap">
          20 New Features! 🎉
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0 border-l-8 border-l-black border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
        </div>
      </div>

      {/* Features Panel */}
      {isOpen && <NewFeaturesPanel onClose={() => setIsOpen(false)} />}

      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </>
  );
}