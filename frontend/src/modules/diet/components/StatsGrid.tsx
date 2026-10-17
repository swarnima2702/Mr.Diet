import React from "react";
import { Flame, Calculator, CalendarDays, Crown } from "lucide-react";
import { UserData } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";

interface StatsGridProps {
  targetCalories: number;
  selectedDay: number;
  calculateBMI: () => string;
  userData: UserData;
  hasActiveSub: boolean;
  activePlanType: string | null;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  targetCalories,
  selectedDay,
  calculateBMI,
  userData,
  hasActiveSub,
  activePlanType
}) => {
  const isRealUser = !(userData as any).is_placeholder;

  // Capitalize activePlanType safely
  const planDisplay = activePlanType 
    ? (activePlanType.charAt(0).toUpperCase() + activePlanType.slice(1).toLowerCase())
    : (hasActiveSub ? "Active" : "Trial");

  const stats = [
    { 
      icon: Flame, 
      label: "TARGET", 
      value: (hasActiveSub && isRealUser) ? `${targetCalories}` : "---", 
      unit: "kcal", 
      color: "text-[#ff4d00]" 
    },
    { 
      icon: Calculator, 
      label: "BMI", 
      value: (hasActiveSub && isRealUser) ? calculateBMI() : "--.-", 
      unit: "", 
      color: "text-[#00ff9d]" 
    },
    { 
      icon: CalendarDays, 
      label: "DAY", 
      value: `${selectedDay + 1}`, 
      unit: "", 
      color: "text-[#3399ff]" 
    },
    { 
      icon: Crown, 
      label: "PLAN", 
      value: planDisplay, 
      unit: "", 
      color: "text-[#eab308]" 
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
      {stats.map((stat, i) => (
        <div 
          key={i} 
          className="bg-[#0f0f0f] border border-white/5 rounded-xl px-4 py-3"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <stat.icon className={cn("h-3 w-3", stat.color)} />
            <span className="text-[9px] font-medium text-muted-foreground tracking-wider uppercase">{stat.label}</span>
          </div>
          <div className="text-base font-semibold text-foreground tabular-nums leading-tight">
            {stat.value}{stat.unit && <span className="text-[10px] text-muted-foreground ml-0.5">{stat.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
};
