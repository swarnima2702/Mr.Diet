export interface UserData {
  id?: number | string;
  user_id?: number | string;
  name?: string;
  email?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  goal?: string;
  activity_level?: string;
  dietary_restrictions?: string[];
  allergies?: string;
  meal_preference?: string;
  plan?: string;
  created_at?: string;
  extended_data?: {
    expectedWeight?: number | string;
    dietType?: string[];
    foodsDislike?: string;
    specialInstructions?: string;
    [key: string]: any;
  };
  cycle_length?: number;
  period_duration?: number;
  last_period_start?: string;
}

export interface Meal {
  type: string;
  time: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  ingredients?: any[];
  tips?: string;
}

export interface TimelineItem {
  time: string;
  type: 'ritual' | 'meal';
  title: string;
  name?: string;
  calories?: string | number;
  protein?: string | number;
  carbs?: string | number;
  fat?: string | number;
  fiber?: string | number;
  option_1?: any;
  option_2?: any;
  items?: any[];
  ingredients?: any[];
  preparation_steps?: string[];
  benefits?: string;
  suggestions?: string;
}

export interface WaterIntakeDetail {
  total_liters: number;
  schedule: string[];
  tips: string[];
}

export interface DayPlan {
  id: number;
  subscription_id: number;
  day_number: number;
  plan_date: string;
  is_unlocked: boolean;
  unlocked_at: string | null;
  is_purchased?: boolean;
  meal_changes_count?: number;
  meal_plan: {
    day_title?: string;
    daily_objectives?: string[];
    timeline?: TimelineItem[];
    meals: Meal[];
    day_summary?: string;
    daily_dos?: string[];
    daily_donts?: string[];
    water_intake?: string | WaterIntakeDetail;
    special_notes?: string;
    target_stats?: {
      calories: string;
      protein: string;
      carbs: string;
      fat: string;
      fiber?: string;
    };
  } | null;
}

export interface CheckinData {
  language: string;
  weight: string;
  mood: string;
  notes: string;
}
