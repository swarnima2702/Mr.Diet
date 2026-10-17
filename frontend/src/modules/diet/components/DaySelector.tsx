import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, Lock, LockOpen } from "lucide-react";
import { DayPlan } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";

interface DaySelectorProps {
  dayPlans: DayPlan[];
  selectedDay: number;
  setSelectedDay: (index: number) => void;
  canUnlockDay: (day: DayPlan, index: number) => boolean;
  getLocalISODate: () => string;
}

export const DaySelector: React.FC<DaySelectorProps> = ({
  dayPlans,
  selectedDay,
  setSelectedDay,
  canUnlockDay,
  getLocalISODate
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollDays = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={() => scrollDays('left')}
        className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#0f0f0f] border border-white/5 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>

      <div 
        ref={scrollContainerRef} 
        className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-1"
      >
        {dayPlans.map((day, index) => {
          const isPurchased = (day as any).is_purchased;
          const isUnlocked = day.is_unlocked;
          const isSelected = selectedDay === index;
          
          return (
            <button
              key={day.day_number}
              onClick={() => setSelectedDay(index)}
              className={cn(
                "flex-shrink-0 h-8 px-4 rounded-lg border text-[10px] font-semibold transition-all flex items-center gap-1.5",
                isSelected 
                  ? "bg-[#1a1608] border-[#eab308]/40 text-[#eab308] shadow-[0_0_15px_rgba(234,179,8,0.1)]" 
                  : isPurchased
                    ? isUnlocked 
                      ? "bg-[#0f0f0f] border-white/10 text-white/90 hover:border-white/20"
                      : "bg-[#0f0f0f] border-white/5 text-muted-foreground hover:border-white/15 hover:text-foreground"
                    : "bg-transparent border-white/5 opacity-40 text-muted-foreground hover:opacity-100 hover:border-white/10"
              )}
            >
              {!isPurchased ? <Lock className="h-2.5 w-2.5 opacity-50" /> : isUnlocked ? <LockOpen className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
              Day {day.day_number}
              {!isPurchased && <span className="ml-1 text-[8px] opacity-60">Buy</span>}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => scrollDays('right')}
        className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#0f0f0f] border border-white/5 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
