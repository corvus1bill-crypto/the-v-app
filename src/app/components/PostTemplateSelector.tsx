import { X, Sparkles } from 'lucide-react';
import { POST_TEMPLATES } from '../hooks/useNewFeatures';

interface PostTemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void;
  onClose: () => void;
}

export function PostTemplateSelector({ onSelectTemplate, onClose }: PostTemplateSelectorProps) {
  const categories = Array.from(new Set(POST_TEMPLATES.map(t => t.category)));

  return (
    <div className="absolute inset-0 z-[100] flex items-end justify-center bg-black/80 animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-background rounded-t-3xl shadow-2xl border-4 border-black animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <div>
            <h2 className="text-2xl font-black uppercase flex items-center gap-2">
              <Sparkles size={24} strokeWidth={3} />
              Templates
            </h2>
            <p className="text-sm opacity-60 font-bold mt-1">Start with a design</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-black text-background rounded-lg hover:scale-110 active:scale-95 transition-transform"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Templates by Category */}
        <div className="p-6 space-y-6 max-h-[70%] overflow-y-auto">
          {categories.map((category) => {
            const categoryTemplates = POST_TEMPLATES.filter(t => t.category === category);
            return (
              <div key={category}>
                <h3 className="text-sm font-black uppercase opacity-60 mb-3">{category}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {categoryTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        onSelectTemplate(template.id);
                        onClose();
                      }}
                      className="aspect-square border-4 border-black bg-white hover:scale-105 active:scale-95 transition-transform flex flex-col items-center justify-center gap-2 p-3"
                    >
                      <span className="text-4xl">{template.thumbnail}</span>
                      <span className="text-xs font-black uppercase text-center leading-tight">
                        {template.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
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