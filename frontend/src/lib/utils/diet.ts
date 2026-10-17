import { Sun, Coffee, Utensils, Moon } from "lucide-react";
import { UserData, DayPlan } from "../types/dashboard";

export const getLocalISODate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split('T')[0];
};

export const cmToFtIn = (cm: number): string => {
  if (!cm) return "0'0\"";
  const inches = cm / 2.54;
  const feet = Math.floor(inches / 12);
  const remainingInches = Math.round(inches % 12);
  return `${feet}'${remainingInches}"`;
};

export const canUnlockDay = (day: DayPlan, index: number, allPlans: DayPlan[] = []): boolean => {
  if (day.is_unlocked) return false;

  // Day 1 can always be attempted if it's not unlocked
  if (index === 0) return true;

  // Future days (Index > 0) can only be unlocked if the previous day is ALREADY unlocked
  const previousDay = allPlans[index - 1];
  if (previousDay && previousDay.is_unlocked) {
    return true;
  }

  return false;
};

// Returns the scheduled calendar date for a given day_number based on Day 1's plan_date.
// e.g. if Day 1 was unlocked on 14 May, Day 4 is scheduled for 17 May (Day 1 + 3 days).
export const getScheduledDateForDay = (dayNumber: number, allPlans: DayPlan[] = []): Date | null => {
  const day1 = allPlans.find((p) => p.day_number === 1);
  if (!day1 || !day1.plan_date) return null;
  const base = new Date(day1.plan_date);
  if (isNaN(base.getTime())) return null;
  base.setDate(base.getDate() + (dayNumber - 1));
  return base;
};

// True if the user is trying to unlock a day before its scheduled calendar date,
// OR before completing previous days. Both are "early" because they skip feedback.
export const isEarlyUnlock = (day: DayPlan, allPlans: DayPlan[] = []): boolean => {
  if (day.is_unlocked) return false;
  if (day.day_number === 1) return false; // Day 1 is never "early"

  // Case A: previous day is still locked → user is skipping ahead
  const previousDay = allPlans.find((p) => p.day_number === day.day_number - 1);
  if (previousDay && !previousDay.is_unlocked) return true;

  // Case B: scheduled calendar date is in the future
  const scheduled = getScheduledDateForDay(day.day_number, allPlans);
  if (!scheduled) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  scheduled.setHours(0, 0, 0, 0);
  return scheduled.getTime() > today.getTime();
};

// True if swap meal must be disabled for this day because the user has already
// unlocked a later day (i.e. they moved on, so today's feedback no longer matters).
export const isSwapDisabledForDay = (day: DayPlan, allPlans: DayPlan[] = []): boolean => {
  if (!day.is_unlocked) return false;
  return allPlans.some(
    (p) => p.is_unlocked && p.day_number > day.day_number && p.subscription_id === day.subscription_id
  );
};

// Friendly date formatter (e.g. "16 May")
export const formatShortDate = (date: Date): string => {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export const calculateBMI = (height?: number, weight?: number): string => {
  if (!height || !weight) return "0.0";
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return bmi.toFixed(1);
};

export const calculateDailyCalories = (userData: UserData): number => {
  if (!userData?.height || !userData?.weight || !userData?.age) return 2000;

  // Mifflin-St Jeor Equation
  let bmr;
  if (userData.gender === 'male') {
    bmr = 10 * userData.weight + 6.25 * userData.height - 5 * userData.age + 5;
  } else {
    bmr = 10 * userData.weight + 6.25 * userData.height - 5 * userData.age - 161;
  }

  // Activity Level Multiplier
  const activityMultipliers: Record<string, number> = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very_active': 1.9
  };

  const multiplier = activityMultipliers[userData.activity_level || 'sedentary'] || 1.2;
  const tdee = bmr * multiplier;

  // Goal Adjustment
  const goal = (userData.goal || "").toLowerCase();
  if (goal.includes('loss')) return Math.round(tdee - 500);
  if (goal.includes('gain')) return Math.round(tdee + 500);
  return Math.round(tdee);
};

export const getMealIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "breakfast": return Sun;
    case "lunch": return Coffee;
    case "dinner": return Moon;
    default: return Utensils;
  }
};
