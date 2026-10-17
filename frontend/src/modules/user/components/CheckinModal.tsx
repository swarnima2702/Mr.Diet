import React from "react";
import ReactDOM from "react-dom";
import { Sun, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckinData } from "@/lib/types/dashboard";

interface CheckinModalProps {
  checkinData: CheckinData;
  setCheckinData: (data: CheckinData) => void;
  processUnlock: (skip: boolean) => void;
  langOptions: string[];
  onClose?: () => void;
}

export const CheckinModal: React.FC<CheckinModalProps> = ({
  checkinData,
  setCheckinData,
  processUnlock,
  langOptions,
  onClose
}) => {
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <Card className="w-full sm:max-w-md bg-background border-gold/20 shadow-2xl rounded-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-white/5 bg-background sticky top-0 z-10 flex flex-row items-center justify-between gap-3 pr-3">
          <CardTitle className="text-base sm:text-xl flex items-center gap-2 min-w-0">
            <Sun className="h-5 w-5 text-gold flex-shrink-0" />
            <span className="truncate">Check-in & Customize</span>
          </CardTitle>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
            Help our AI expert personalize your plan by selecting your preferred language and current symptoms.
          </p>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-auto block">
              1. Response Language
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {langOptions.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCheckinData({ ...checkinData, language: lang })}
                  className={`py-3 px-3 text-xs uppercase tracking-wider font-bold rounded-xl border-2 transition-all ${
                    checkinData.language === lang
                    ? 'border-gold bg-gold/10 text-white'
                    : 'border-white/5 bg-white/5 hover:border-gold/30 text-muted-foreground'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-auto block">
              2. How are you feeling today?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {['Energy Low', 'Stress', 'Bloating'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    const currentNotes = checkinData.notes || "";
                    if (currentNotes.includes(tag)) {
                      setCheckinData({ ...checkinData, notes: currentNotes.replace(new RegExp(`${tag}(,\\s*)?`), "").trim().replace(/^,\s*|,\s*$/, "") });
                    } else {
                      setCheckinData({ ...checkinData, notes: currentNotes ? `${currentNotes}, ${tag}` : tag });
                    }
                  }}
                  className={`py-3 px-3 text-xs uppercase tracking-wider font-bold rounded-xl border-2 transition-all ${
                    checkinData.notes?.includes(tag)
                    ? 'border-gold bg-gold/10 text-white'
                    : 'border-white/5 bg-white/5 hover:border-gold/30 text-muted-foreground'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-auto block">
              3. Custom Notes (Quantities, Likings, etc.)
            </label>
            <textarea
              className="w-full p-3 sm:p-4 rounded-xl border border-white/10 bg-white/5 h-20 sm:h-24 resize-none focus:outline-none focus:ring-1 focus:ring-gold/40 text-[12px] sm:text-[11px] placeholder:text-muted-foreground/30 transition-all text-white"
              placeholder="e.g., I'm at my friend's house, please suggest accordingly..."
              value={checkinData.notes}
              onChange={(e) => setCheckinData({ ...checkinData, notes: e.target.value })}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="outline" className="flex-1 h-14 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white/5" onClick={() => processUnlock(true)}>
              Default Plan
            </Button>
            <Button variant="luxury" className="flex-1 h-14 text-xs font-black uppercase tracking-widest rounded-xl" onClick={() => processUnlock(false)}>
              Generate Personalized
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>,
    document.body
  );
};

