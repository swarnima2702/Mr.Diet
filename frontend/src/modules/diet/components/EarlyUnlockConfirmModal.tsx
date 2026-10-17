import React from "react";
import ReactDOM from "react-dom";
import { Unlock, MessageSquare, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EarlyUnlockConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dayNumber: number;
  scheduledDateLabel: string;   // e.g. "16 May"
  currentDayNumber: number;     // the day they're presently on (Day N-1)
}

export const EarlyUnlockConfirmModal: React.FC<EarlyUnlockConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  dayNumber,
  scheduledDateLabel,
  currentDayNumber,
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0f0f0f] border border-gold/20 rounded-2xl max-w-md w-full p-6 md:p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-3 border border-gold/20">
            <Unlock className="h-6 w-6 text-gold" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1.5">
            Unlock Day {dayNumber} now?
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
            Day {dayNumber} was scheduled to unlock on {scheduledDateLabel}. You can
            unlock it now, but read the trade-offs below first.
          </p>
        </div>

        {/* Trade-offs */}
        <div className="space-y-3 mb-5">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border border-white/5">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
              <MessageSquare className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-white mb-1">
                Skipping feedback hurts personalisation
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Finishing today's plan and submitting feedback helps the AI tune
                tomorrow's meals to what worked for you. Unlocking early skips
                that signal.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border border-white/5">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <RefreshCw className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-white mb-1">
                Swap meal will be disabled on your current day
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Once Day {dayNumber} is unlocked, you can no longer swap meals
                on Day {currentDayNumber}. Future swaps will only work on Day{" "}
                {dayNumber}.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-emerald-300 mb-1">
                Better: unlock after dinner tonight
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Eating today's full plan first gives the AI complete data —
                weight check-in, mood, energy, what you actually ate. Unlocking
                before dinner throws away half of tomorrow's personalisation
                signal.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            variant="luxury"
            size="lg"
            onClick={onConfirm}
            className="w-full font-bold text-sm tracking-wide"
          >
            <Unlock className="mr-2 h-4 w-4" />
            Unlock Day {dayNumber} now
          </Button>
          <button
            onClick={onClose}
            className="w-full text-xs text-muted-foreground hover:text-white py-2 transition-colors"
          >
            I'll wait and give feedback first
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
