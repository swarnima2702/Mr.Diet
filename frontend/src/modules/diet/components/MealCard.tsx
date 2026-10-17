import React from "react";
import { Clock } from "lucide-react";
import { Meal } from "@/lib/types/dashboard";
import { getMealIcon } from "@/lib/utils/diet";

interface MealCardProps {
  meal: Meal;
  index: number;
}

export const MealCard: React.FC<MealCardProps> = ({ meal }) => {
  const MealIcon = getMealIcon(meal.type);

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors group">
      <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
        <MealIcon className="h-5 w-5 text-gold" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground capitalize">{meal.type}</p>
            <span className="text-xs text-gold flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {meal.time}
            </span>
          </div>
          <span className="text-xs font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full">{meal.calories} kcal</span>
        </div>
        <p className="font-semibold mb-1">{meal.name}</p>
        {(meal.protein || meal.carbs || meal.fat) && (
          <div className="flex gap-3 text-[10px] text-muted-foreground mb-2">
            {meal.protein && <span>Protein: <span className="font-medium text-foreground">{meal.protein}g</span></span>}
            {meal.carbs && <span>Carbs: <span className="font-medium text-foreground">{meal.carbs}g</span></span>}
            {meal.fat && <span>Fat: <span className="font-medium text-foreground">{meal.fat}g</span></span>}
          </div>
        )}
        {meal.ingredients && meal.ingredients.length > 0 && (
          <div className="mt-2 mb-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 block">Ingredients</span>
            <div className="flex flex-wrap gap-1.5">
              {meal.ingredients.map((ing, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded bg-background border border-border text-foreground/80">
                  {typeof ing === 'object' ? `${ing.quantity || ''} ${ing.item || ''}` : ing}
                </span>
              ))}
            </div>
          </div>
        )}
        {meal.tips && (
          <p className="text-xs text-gold/80 mt-2 italic flex items-start gap-1">
            <span>💡</span>
            <span>{meal.tips}</span>
          </p>
        )}
      </div>
    </div>
  );
};
