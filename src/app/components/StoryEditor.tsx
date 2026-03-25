import { useState, useRef, useEffect } from 'react';
import { Type, Smile, Pen, Trash2, MoveIcon, X } from 'lucide-react';

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
}

interface Sticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
}

interface DrawPath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

interface StoryEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
}

const COLORS = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#ff7a2e'];
const STICKERS = ['😀', '😂', '❤️', '🔥', '👍', '🎉', '✨', '💯', '🙌', '💪', '🌟', '⚡', '🎵', '📸', '🌈'];

export function StoryEditor({ imageUrl, onSave, onCancel }: StoryEditorProps) {
  const [tool, setTool] = useState<'none' | 'text' | 'draw' | 'sticker'>('none');
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [drawPaths, setDrawPaths] = useState<DrawPath[]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  
  // Tool states
  const [textInput, setTextInput] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [drawColor, setDrawColor] = useState('#FF0000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: 'text' | 'sticker'; id: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAddText = () => {
    if (!textInput.trim()) return;
    
    const newText: TextOverlay = {
      id: `text-${Date.now()}`,
      text: textInput,
      x: 50,
      y: 50,
      color: textColor,
      fontSize: 32
    };
    
    setTextOverlays([...textOverlays, newText]);
    setTextInput('');
    setTool('none');
  };

  const handleAddSticker = (emoji: string) => {
    const newSticker: Sticker = {
      id: `sticker-${Date.now()}`,
      emoji,
      x: 50,
      y: 50,
      size: 64
    };
    
    setStickers([...stickers, newSticker]);
    setTool('none');
  };

  const handleDrawStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (tool !== 'draw') return;
    
    setIsDrawing(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    setCurrentPath([{ x, y }]);
  };

  const handleDrawMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || tool !== 'draw') return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    setCurrentPath([...currentPath, { x, y }]);
  };

  const handleDrawEnd = () => {
    if (!isDrawing || currentPath.length === 0) return;
    
    const newPath: DrawPath = {
      id: `path-${Date.now()}`,
      points: currentPath,
      color: drawColor,
      width: 4
    };
    
    setDrawPaths([...drawPaths, newPath]);
    setCurrentPath([]);
    setIsDrawing(false);
  };

  const handleDeleteSelected = () => {
    if (!selectedItem) return;
    
    if (selectedItem.type === 'text') {
      setTextOverlays(textOverlays.filter(t => t.id !== selectedItem.id));
    } else if (selectedItem.type === 'sticker') {
      setStickers(stickers.filter(s => s.id !== selectedItem.id));
    }
    
    setSelectedItem(null);
  };

  const handleClearDrawings = () => {
    setDrawPaths([]);
    setCurrentPath([]);
  };

  const handleSave = async () => {
    // Create a canvas to composite everything
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Draw base image
      ctx.drawImage(img, 0, 0);
      
      // Scale factors
      const scaleX = img.width / (containerRef.current?.clientWidth || 1);
      const scaleY = img.height / (containerRef.current?.clientHeight || 1);
      
      // Draw paths
      drawPaths.forEach(path => {
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width * Math.max(scaleX, scaleY);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        path.points.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point.x * scaleX, point.y * scaleY);
          } else {
            ctx.lineTo(point.x * scaleX, point.y * scaleY);
          }
        });
        ctx.stroke();
      });
      
      // Draw text overlays
      textOverlays.forEach(text => {
        ctx.fillStyle = text.color;
        ctx.font = `bold ${text.fontSize * Math.max(scaleX, scaleY)}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Add text stroke for visibility
        ctx.strokeStyle = text.color === '#FFFFFF' ? '#000000' : '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeText(text.text, text.x * scaleX, text.y * scaleY);
        ctx.fillText(text.text, text.x * scaleX, text.y * scaleY);
      });
      
      // Draw stickers
      stickers.forEach(sticker => {
        ctx.font = `${sticker.size * Math.max(scaleX, scaleY)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sticker.emoji, sticker.x * scaleX, sticker.y * scaleY);
      });
      
      // Convert to data URL
      const editedImageUrl = canvas.toDataURL('image/jpeg', 1.0);
      onSave(editedImageUrl);
    };
  };

  return (
    <div className="absolute inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <button 
            onClick={onCancel}
            className="w-10 h-10 bg-card border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
          >
            <X size={20} strokeWidth={3} className="text-foreground" />
          </button>
          
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-background border-4 border-foreground text-foreground font-black uppercase text-lg shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all"
          >
            🚀 POST
          </button>
          
          <div className="flex items-center gap-2">
            {selectedItem && (
              <button 
                onClick={handleDeleteSelected}
                className="px-4 py-2 bg-red-500 border-2 border-foreground text-white font-black uppercase shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center gap-2"
              >
                <Trash2 size={16} strokeWidth={3} />
                DELETE
              </button>
            )}
            
            {drawPaths.length > 0 && (
              <button 
                onClick={handleClearDrawings}
                className="px-4 py-2 bg-gray-500 border-2 border-foreground text-white font-black uppercase shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
              >
                CLEAR DRAW
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden touch-none"
        onMouseDown={handleDrawStart}
        onMouseMove={handleDrawMove}
        onMouseUp={handleDrawEnd}
        onMouseLeave={handleDrawEnd}
        onTouchStart={handleDrawStart}
        onTouchMove={handleDrawMove}
        onTouchEnd={handleDrawEnd}
      >
        {/* Base Image */}
        <img src={imageUrl} alt="Story" className="w-full h-full object-contain" />
        
        {/* Drawing Canvas */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {drawPaths.map(path => (
            <polyline
              key={path.id}
              points={path.points.map(p => `${p.x},${p.y}`).join(' ')}
              stroke={path.color}
              strokeWidth={path.width}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {currentPath.length > 0 && (
            <polyline
              points={currentPath.map(p => `${p.x},${p.y}`).join(' ')}
              stroke={drawColor}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
        
        {/* Text Overlays */}
        {textOverlays.map(text => (
          <div
            key={text.id}
            className={`absolute cursor-move select-none ${selectedItem?.id === text.id ? 'ring-4 ring-yellow-400' : ''}`}
            style={{
              left: `${text.x}px`,
              top: `${text.y}px`,
              color: text.color,
              fontSize: `${text.fontSize}px`,
              fontWeight: 'bold',
              textShadow: text.color === '#FFFFFF' ? '2px 2px 4px #000000' : '2px 2px 4px #FFFFFF',
              pointerEvents: tool === 'draw' ? 'none' : 'auto'
            }}
            onClick={() => setSelectedItem({ type: 'text', id: text.id })}
          >
            {text.text}
          </div>
        ))}
        
        {/* Stickers */}
        {stickers.map(sticker => (
          <div
            key={sticker.id}
            className={`absolute cursor-move select-none ${selectedItem?.id === sticker.id ? 'ring-4 ring-yellow-400' : ''}`}
            style={{
              left: `${sticker.x}px`,
              top: `${sticker.y}px`,
              fontSize: `${sticker.size}px`,
              pointerEvents: tool === 'draw' ? 'none' : 'auto'
            }}
            onClick={() => setSelectedItem({ type: 'sticker', id: sticker.id })}
          >
            {sticker.emoji}
          </div>
        ))}
      </div>

      {/* Tool Panel */}
      {tool === 'text' && (
        <div className="absolute bottom-20 left-0 right-0 p-4 bg-black/90 border-t-4 border-white">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="TYPE YOUR TEXT..."
              className="w-full px-4 py-3 bg-white border-2 border-black text-black font-bold uppercase outline-none"
              autoFocus
            />
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setTextColor(color)}
                  className={`w-10 h-10 border-2 border-black flex-shrink-0 ${textColor === color ? 'ring-4 ring-white' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button
              onClick={handleAddText}
              disabled={!textInput.trim()}
              className="w-full px-6 py-3 bg-background border-2 border-foreground text-foreground font-black uppercase shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all disabled:opacity-50"
            >
              ADD TEXT
            </button>
          </div>
        </div>
      )}

      {tool === 'sticker' && (
        <div className="absolute bottom-20 left-0 right-0 p-4 bg-black/90 border-t-4 border-white">
          <div className="grid grid-cols-5 gap-3 max-h-48 overflow-y-auto">
            {STICKERS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleAddSticker(emoji)}
                className="text-4xl p-2 bg-card border-2 border-foreground hover:bg-background transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {tool === 'draw' && (
        <div className="absolute bottom-20 left-0 right-0 p-4 bg-black/90 border-t-4 border-white">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {COLORS.map(color => (
              <button
                key={color}
                onClick={() => setDrawColor(color)}
                className={`w-12 h-12 border-2 border-foreground flex-shrink-0 ${drawColor === color ? 'ring-4 ring-white' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bottom Toolbar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black border-t-4 border-white">
        <div className="flex items-center justify-around gap-2 mb-4">
          <button
            onClick={() => setTool(tool === 'text' ? 'none' : 'text')}
            className={`flex-1 px-4 py-3 border-2 border-foreground font-black uppercase shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center gap-2 ${
              tool === 'text' ? 'bg-background text-foreground' : 'bg-card text-foreground'
            }`}
          >
            <Type size={20} strokeWidth={3} />
            TEXT
          </button>
          
          <button
            onClick={() => setTool(tool === 'draw' ? 'none' : 'draw')}
            className={`flex-1 px-4 py-3 border-2 border-foreground font-black uppercase shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center gap-2 ${
              tool === 'draw' ? 'bg-background text-foreground' : 'bg-card text-foreground'
            }`}
          >
            <Pen size={20} strokeWidth={3} />
            DRAW
          </button>
          
          <button
            onClick={() => setTool(tool === 'sticker' ? 'none' : 'sticker')}
            className={`flex-1 px-4 py-3 border-2 border-foreground font-black uppercase shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center gap-2 ${
              tool === 'sticker' ? 'bg-background text-foreground' : 'bg-card text-foreground'
            }`}
          >
            <Smile size={20} strokeWidth={3} />
            STICKER
          </button>
        </div>
        
        <button
          onClick={handleSave}
          className="w-full px-6 py-5 bg-background border-4 border-foreground text-foreground font-black uppercase text-xl shadow-[6px_6px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_var(--foreground)] transition-all animate-pulse"
        >
          🚀 POST VIBE NOW
        </button>
      </div>
    </div>
  );
}