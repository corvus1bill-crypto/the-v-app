import { useState } from 'react';
import { X, Flag, AlertTriangle, MessageSquare, User, Image as ImageIcon, Shield, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postUsername: string;
  onSubmit: (reason: string, details: string) => void;
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam', icon: Ban, description: 'Repetitive or misleading content' },
  { id: 'harassment', label: 'Harassment', icon: AlertTriangle, description: 'Bullying or hateful content' },
  { id: 'inappropriate', label: 'Inappropriate', icon: Shield, description: 'Nudity or sexual content' },
  { id: 'violence', label: 'Violence', icon: AlertTriangle, description: 'Graphic or violent content' },
  { id: 'fake', label: 'Fake Account', icon: User, description: 'Impersonation or fake profile' },
  { id: 'copyright', label: 'Copyright', icon: ImageIcon, description: 'Unauthorized use of content' },
  { id: 'other', label: 'Other', icon: MessageSquare, description: 'Something else' },
];

export function ReportModal({ isOpen, onClose, postId, postUsername, onSubmit }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    await onSubmit(selectedReason, details);
    setIsSubmitting(false);
    setSubmitted(true);

    // Auto-close after 2 seconds
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDetails('');
    setSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-[300] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card border-4 border-foreground shadow-[12px_12px_0px_0px_var(--foreground)] max-h-[90%] overflow-hidden flex flex-col"
          >
            {submitted ? (
              // Success State
              <div className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-green-500 border-4 border-foreground flex items-center justify-center shadow-[4px_4px_0px_0px_var(--foreground)]">
                  <Flag className="text-white" size={40} strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-black uppercase mb-2">Reported!</h2>
                <p className="text-sm font-bold text-muted-foreground">
                  We'll review this content and take appropriate action.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-4 border-foreground bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 border-2 border-foreground flex items-center justify-center">
                      <Flag className="text-white" size={20} strokeWidth={3} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black uppercase">Report Post</h2>
                      <p className="text-xs font-bold text-muted-foreground">@{postUsername}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 border-2 border-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
                  >
                    <X size={20} strokeWidth={3} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <p className="text-sm font-bold mb-4 text-foreground/70">
                    Why are you reporting this post?
                  </p>

                  {/* Reasons */}
                  <div className="space-y-2 mb-6">
                    {REPORT_REASONS.map((reason) => {
                      const Icon = reason.icon;
                      return (
                        <button
                          key={reason.id}
                          onClick={() => setSelectedReason(reason.id)}
                          className={`w-full p-3 border-2 border-foreground text-left transition-all ${
                            selectedReason === reason.id
                              ? 'bg-red-500 text-white shadow-[4px_4px_0px_0px_var(--foreground)] -translate-y-1'
                              : 'bg-card hover:bg-red-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={20} strokeWidth={3} />
                            <div className="flex-1">
                              <div className="font-bold text-sm">{reason.label}</div>
                              <div className={`text-xs ${selectedReason === reason.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                                {reason.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Additional Details */}
                  {selectedReason && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2"
                    >
                      <label className="block text-sm font-black uppercase text-foreground">
                        Additional Details (Optional)
                      </label>
                      <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Provide more context..."
                        className="w-full px-3 py-2 border-2 border-foreground font-medium text-sm outline-none bg-card text-foreground focus:shadow-[4px_4px_0px_0px_var(--foreground)] focus:-translate-y-1 transition-all resize-none"
                        rows={3}
                      />
                    </motion.div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t-4 border-foreground bg-card space-y-2">
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedReason || isSubmitting}
                    className="w-full py-3 bg-red-500 text-white font-black uppercase border-2 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-[4px_4px_0px_0px_var(--foreground)]"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full py-3 bg-card text-foreground font-bold uppercase border-2 border-foreground hover:bg-secondary transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
