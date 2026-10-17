import React, { useState } from "react";
import ReactDOM from "react-dom";
import { X, ChefHat, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealSubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealTitle: string;
  mealIndex: number;
  macroTargets: MacroTargets;
  subscriptionId: number;
  dayNumber: number;
  changesRemaining: number;
  onSubstituted: (newMeal: any, updatedChangesCount: number) => void;
}

export const MealSubstitutionModal: React.FC<MealSubstitutionModalProps> = ({
  isOpen,
  onClose,
  mealTitle,
  mealIndex,
  macroTargets,
  subscriptionId,
  dayNumber,
  changesRemaining,
  onSubstituted,
}) => {
  const [userHas, setUserHas] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubstitute = async () => {
    if (!userHas.trim()) {
      toast.error("Please tell us what food you have available.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await api.dietPlans.substituteMeal({
        subscription_id: subscriptionId,
        day_number: dayNumber,
        meal_index: mealIndex,
        user_has: userHas.trim(),
        target_macros: macroTargets,
      });
      if (result.meal) {
        toast.success("Meal substituted successfully!");
        onSubstituted(result.meal, result.changes_remaining);
        onClose();
      } else {
        toast.error(result.error || "Could not generate substitution.");
      }
    } catch (e: any) {
      toast.error("Substitution failed: " + (e.message || "Server error"));
    } finally {
      setIsLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-gold" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Change Meal</h2>
              <p className="text-[10px] text-muted-foreground">{mealTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Macro Targets */}
        <div className="p-5 border-b border-white/5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Meal Targets (AI will match these)
          </p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Calories", value: `${macroTargets.calories} kcal`, color: "text-gold" },
              { label: "Protein", value: `${macroTargets.protein}g`, color: "text-blue-400" },
              { label: "Carbs", value: `${macroTargets.carbs}g`, color: "text-green-400" },
              { label: "Fat", value: `${macroTargets.fat}g`, color: "text-orange-400" },
            ].map((item) => (
              <div
                key={item.label}
                className="text-center p-2.5 rounded-xl bg-white/5 border border-white/5"
              >
                <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              What food do you have available?
            </label>
            <textarea
              value={userHas}
              onChange={(e) => setUserHas(e.target.value)}
              placeholder="e.g., I have dal, rice and sabzi at home... or I have eggs, bread and milk available..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/40 resize-none transition-colors"
            />
          </div>

          {/* Changes remaining badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <RefreshCw className="w-3 h-3" />
              <span>
                <span className={`font-bold ${changesRemaining <= 1 ? "text-red-400" : "text-gold"}`}>
                  {changesRemaining}
                </span>{" "}
                changes remaining today
              </span>
            </div>
          </div>

          <Button
            onClick={handleSubstitute}
            disabled={isLoading || !userHas.trim()}
            className="w-full h-11 bg-gold text-black font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-gold/90 shadow-[0_4px_20px_rgba(234,179,8,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI is calculating quantities...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Substitute & Calculate
              </>
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
