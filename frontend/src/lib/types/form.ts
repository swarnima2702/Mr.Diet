export type FormData = {
  // Basic Info
  name: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  heightFt: string;
  heightIn: string;
  weight: string;
  city: string;

  // Occupation & Lifestyle
  occupation: string;
  workingHours: string;
  maritalStatus: string;
  children: string;
  livingSituation: string;

  // Goals
  hormonalGoals: string[];
  primaryFitnessGoals: string[];
  targetTimeline: string;
  expectedWeight: string;
  motivationLevel: string;

  // Medical Conditions
  lifestyleMetabolic: string[];
  digestiveHealth: string[];
  hormonalMaleSpecific: string[];
  hormonalFemaleSpecific: string[];
  otherConditions: string[];

  // Female Specific
  menstrualRegularity: string;
  averageCycleLength: string;
  periodDuration: string;
  menstrualFlow: string;
  periodSymptoms: string[];
  pcos: string;
  pregnancyStatus: string;

  // Supplements & History
  currentSupplements: string[];
  pastSurgeries: string;
  digestiveHealthOverall: string;

  // Lifestyle Habits
  alcoholConsumption: string;
  smokingHabit: string;

  // Daily Routine
  wakeUpTime: string;
  sleepTime: string;
  sleepDuration: string;
  sleepQuality: string;
  dailyMovementLevel: string;
  stressLevel: string;
  waterIntake: string;

  // Physical Activity
  currentlyExercise: string;
  exerciseTypes: string[];
  exerciseFrequency: string;

  // Food Preferences
  dietType: string[];
  foodsDislike: string;
  foodAllergies: string[];
  foodAllergiesOther: string;
  teaCoffeeIntake: string;
  outsideFood: string;
  spiceTolerance: string;

  // Meal Timings
  breakfastTime: string;
  midMorningSnackTime: string;
  lunchTime: string;
  eveningSnackTime: string;
  dinnerTime: string;
  lateNightEating: string;

  // Household Setup
  whoCooksMeals: string;
  kitchenAppliances: string[];
  budgetForFood: string;

  // Special Instructions
  specialInstructions: string;
};

export interface Plan {
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  days: number;
  features: string[];
  planKey: string;
}
