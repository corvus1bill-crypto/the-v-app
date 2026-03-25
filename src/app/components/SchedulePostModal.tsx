import { X, Calendar, Clock } from 'lucide-react';
import { useState } from 'react';

interface SchedulePostModalProps {
  onSchedule: (date: string) => void;
  onClose: () => void;
}

export function SchedulePostModal({ onSchedule, onClose }: SchedulePostModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const handleSchedule = () => {
    if (selectedDate && selectedTime) {
      const scheduledDateTime = `${selectedDate}T${selectedTime}:00`;
      onSchedule(scheduledDateTime);
      onClose();
    }
  };

  // Get min date (today) and max date (30 days from now)
  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 animate-in fade-in duration-200 p-6">
      <div className="w-full max-w-[380px] bg-background rounded-lg shadow-2xl border-4 border-black animate-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b-4 border-black">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black uppercase flex items-center gap-2">
                <Calendar size={20} strokeWidth={3} />
                Schedule Post
              </h2>
              <p className="text-sm opacity-60 font-bold mt-1">Choose when to publish</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-black text-background rounded-lg hover:scale-110 active:scale-95 transition-transform"
            >
              <X size={16} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Date & Time Pickers */}
        <div className="p-6 space-y-4">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-black uppercase opacity-60 mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar size={20} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={today}
                max={maxDate}
                className="w-full py-3 pl-12 pr-4 border-4 border-black font-bold text-sm focus:outline-none focus:ring-4 focus:ring-black/20"
              />
            </div>
          </div>

          {/* Time Picker */}
          <div>
            <label className="block text-xs font-black uppercase opacity-60 mb-2">
              Time
            </label>
            <div className="relative">
              <Clock size={20} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full py-3 pl-12 pr-4 border-4 border-black font-bold text-sm focus:outline-none focus:ring-4 focus:ring-black/20"
              />
            </div>
          </div>

          {/* Quick Options */}
          <div>
            <label className="block text-xs font-black uppercase opacity-60 mb-2">
              Quick Options
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
                  setSelectedDate(tomorrow.toISOString().split('T')[0]);
                  setSelectedTime('09:00');
                }}
                className="py-3 border-4 border-black bg-white hover:bg-black hover:text-background font-black uppercase text-xs transition-colors"
              >
                Tomorrow 9AM
              </button>
              <button
                onClick={() => {
                  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                  setSelectedDate(nextWeek.toISOString().split('T')[0]);
                  setSelectedTime('12:00');
                }}
                className="py-3 border-4 border-black bg-white hover:bg-black hover:text-background font-black uppercase text-xs transition-colors"
              >
                Next Week 12PM
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 space-y-2">
          <button
            onClick={handleSchedule}
            disabled={!selectedDate || !selectedTime}
            className={`w-full py-4 font-black uppercase border-4 border-black transition-all ${
              selectedDate && selectedTime
                ? 'bg-black text-background hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
            }`}
          >
            Schedule Post
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-white text-black font-black uppercase border-4 border-black hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}