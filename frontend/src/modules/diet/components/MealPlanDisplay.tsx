import React, { useState } from "react";
import { Lock, Unlock, Sparkles, Utensils, Crown, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DayPlan } from "@/lib/types/dashboard";
import { TimelineItemCard } from "./TimelineItemCard";
import { MealCard } from "./MealCard";
import { EarlyUnlockConfirmModal } from "./EarlyUnlockConfirmModal";
import {
  isEarlyUnlock,
  getScheduledDateForDay,
  formatShortDate,
  isSwapDisabledForDay,
} from "@/lib/utils/diet";

interface MealPlanDisplayProps {
  currentDayPlan: DayPlan | null;
  selectedDay: number;
  dayPlans: DayPlan[];
  canUnlockDay: (day: DayPlan, index: number) => boolean;
  unlockTodaysPlan: () => void;
  isGenerating: boolean;
  pendingTimer: boolean;
  timeLeft: string;
  isTimerExpired: boolean;
  handleTimerExpiryUnlock: () => void;
  userData: any;
  activePlanType?: string | null;
  onMealSubstituted?: (mealIndex: number, newMeal: any, updatedChangesCount: number) => void;
}

export const MealPlanDisplay: React.FC<MealPlanDisplayProps> = ({
  currentDayPlan,
  selectedDay,
  dayPlans,
  canUnlockDay,
  unlockTodaysPlan,
  isGenerating,
  pendingTimer,
  timeLeft,
  isTimerExpired,
  handleTimerExpiryUnlock,
  userData,
  activePlanType,
  onMealSubstituted,
}) => {
  const [showEarlyConfirm, setShowEarlyConfirm] = useState(false);

  if (!currentDayPlan) return null;

  const isPurchased = (currentDayPlan as any).is_purchased;
  const changesRemaining = 5 - (currentDayPlan.meal_changes_count || 0);
  const swapDisabled = isSwapDisabledForDay(currentDayPlan, dayPlans);

  const handleUnlockClick = () => {
    if (isEarlyUnlock(currentDayPlan, dayPlans)) {
      setShowEarlyConfirm(true);
    } else {
      unlockTodaysPlan();
    }
  };

  const scheduledDate = getScheduledDateForDay(currentDayPlan.day_number, dayPlans);
  const scheduledLabel = scheduledDate ? formatShortDate(scheduledDate) : "";
  // The day the user is presently on (latest unlocked day_number)
  const currentUnlockedDayNumber =
    [...dayPlans]
      .filter((p) => p.is_unlocked)
      .map((p) => p.day_number)
      .sort((a, b) => b - a)[0] || (currentDayPlan.day_number - 1);

  // Reusable modal — rendered in whichever branch returns
  const earlyUnlockModal = (
    <EarlyUnlockConfirmModal
      isOpen={showEarlyConfirm}
      onClose={() => setShowEarlyConfirm(false)}
      onConfirm={() => {
        setShowEarlyConfirm(false);
        unlockTodaysPlan();
      }}
      dayNumber={currentDayPlan.day_number}
      scheduledDateLabel={scheduledLabel}
      currentDayNumber={currentUnlockedDayNumber}
    />
  );

  if (!currentDayPlan.is_unlocked) {
    return (
      <Card variant="luxury" data-aos="fade-up" data-aos-delay="300">
        <CardContent className="p-5 md:p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-gold/5 flex items-center justify-center mx-auto mb-4 border border-gold/10">
            {!isPurchased ? (
               <Utensils className="h-6 w-6 text-muted-foreground/30" />
            ) : canUnlockDay(currentDayPlan, selectedDay) ? (
              <Unlock className="h-6 w-6 text-gold" />
            ) : (
              <Lock className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <h2 className="text-lg font-bold mb-2 tracking-tight">Day {currentDayPlan.day_number} Plan</h2>
          
          {!isPurchased ? (
            <div className="space-y-4">
               <p className="text-muted-foreground text-[11px] max-w-xs mx-auto leading-relaxed">This day is not included in your current subscription. Upgrade your plan to unlock all 30 days of precision nutrition.</p>
               <Button
                variant="luxury"
                size="sm"
                onClick={() => {
                   window.location.href = `/pricing`;
                 }}
                className="bg-gold text-black hover:bg-gold/90 border-0 font-bold text-sm uppercase tracking-widest px-6 whitespace-normal h-auto py-2.5"
               >
                 Upgrade & Unlock Day {currentDayPlan.day_number}
               </Button>
            </div>
          ) : canUnlockDay(currentDayPlan, selectedDay) ? (
            pendingTimer && !isTimerExpired ? (
              <div className="mb-4">
                <Sparkles className="h-8 w-8 text-blue-500 animate-pulse mx-auto mb-3" />
                <h3 className="text-base font-bold mb-1.5">Our Experts Are Curating Your Plan</h3>
                <div className="bg-secondary/50 p-3 rounded-xl border border-border inline-block min-w-[160px]">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Estimated Time</p>
                  <p className="text-xl font-mono text-gold font-bold">{timeLeft}</p>
                </div>
              </div>
            ) : isTimerExpired ? (
              <Button variant="luxury" size="sm" onClick={handleTimerExpiryUnlock} disabled={isGenerating} className="whitespace-normal h-auto py-2.5 px-6 font-bold text-sm">
                {isGenerating ? <Sparkles className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                View Your Plan
              </Button>
            ) : (
              (userData as any)?.is_placeholder ? (
                <Button variant="luxury" size="sm" onClick={() => window.location.href='/health-metrics'} className="whitespace-normal h-auto py-2.5 px-6 font-bold text-sm">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Complete Health Data to Unlock
                </Button>
              ) : (
                <Button variant="luxury" size="sm" onClick={handleUnlockClick} disabled={isGenerating} className="whitespace-normal h-auto py-2.5 px-6 min-h-[38px] font-bold text-sm tracking-wide">
                  {isGenerating ? <Sparkles className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {(!activePlanType || activePlanType === "trial")
                    ? "Get Your Free Diet Plan"
                    : "Get Your Diet Plan for Today"}
                </Button>
              )
            )
          ) : (
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <p className="text-gold font-bold text-base md:text-lg">
                        Best to finish Day {currentDayPlan.day_number - 1} first
                    </p>
                    <p className="text-muted-foreground text-xs italic max-w-sm mx-auto leading-relaxed">
                        Completing your previous day's plan and check-in helps the AI tune Day {currentDayPlan.day_number}'s meals to what worked for you.
                    </p>
                </div>

                <div className="pt-2 flex flex-col items-center gap-2">
                    <Button
                        variant="luxury"
                        size="sm"
                        onClick={handleUnlockClick}
                        disabled={isGenerating}
                        className="whitespace-normal h-auto py-2.5 px-6 font-bold text-sm tracking-wide"
                    >
                        {isGenerating ? <Sparkles className="mr-2 h-4 w-4 animate-spin" /> : <Unlock className="mr-2 h-4 w-4" />}
                        Unlock Day {currentDayPlan.day_number} Early
                    </Button>
                    <p className="text-[10px] text-muted-foreground/70 max-w-xs leading-relaxed">
                        You can unlock now, but Day {currentDayPlan.day_number - 1}'s swap meal will be disabled.
                    </p>
                </div>
            </div>
          )}
        </CardContent>
        {earlyUnlockModal}
      </Card>
    );
  }

  if (!currentDayPlan.meal_plan) return null;

  return (
    <Card variant="luxury" data-aos="fade-up" data-aos-delay="300">
      <CardHeader>
        <CardTitle className="text-[17px] md:text-xl font-bold flex items-center gap-2">
          {currentDayPlan.meal_plan.day_title ? (
            <><Crown className="h-5 w-5 text-gold shrink-0" />{currentDayPlan.meal_plan.day_title}</>
          ) : (
            <><Utensils className="h-4 w-4 text-gold shrink-0" />Day {currentDayPlan.day_number} Meal Plan</>
          )}
        </CardTitle>
        {currentDayPlan.meal_plan.daily_objectives && (
          <div className="mt-4 p-5 rounded-2xl bg-[#0a0a0a] border border-gold/15 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Target className="w-16 h-16 text-gold" />
            </div>
            <h4 className="text-[11px] font-black text-gold uppercase tracking-[0.2em] mb-4 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-gold/10 border border-gold/20">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              Strategic Day Objectives
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10 font-medium">
              {currentDayPlan.meal_plan.daily_objectives.map((obj, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:border-gold/20 transition-all group/obj">
                   <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center border border-gold/20 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                   </div>
                   <span className="text-[11px] text-muted-foreground leading-relaxed group-hover/obj:text-white transition-colors">{String(obj)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {currentDayPlan.meal_plan.timeline ? (
          currentDayPlan.meal_plan.timeline.map((item, index) => (
            <TimelineItemCard
              key={index}
              item={item}
              index={index}
              total={currentDayPlan.meal_plan?.timeline?.length || 0}
              mealIndex={index}
              subscriptionId={currentDayPlan.subscription_id}
              dayNumber={currentDayPlan.day_number}
              changesRemaining={changesRemaining}
              swapDisabled={swapDisabled}
              onMealSubstituted={onMealSubstituted}
            />
          ))
        ) : (
          currentDayPlan.meal_plan.meals.map((meal, index) => (
            <MealCard key={index} meal={meal} index={index} />
          ))
        )}
      </CardContent>
    </Card>
  );
};
