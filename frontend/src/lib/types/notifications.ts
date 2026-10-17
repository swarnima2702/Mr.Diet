export interface NotificationPreferences {
  user_id?: number;
  onesignal_player_id?: string | null;
  water_reminder_enabled: boolean;
  water_reminder_interval: number;
  water_reminder_start: string;
  water_reminder_end: string;
  meal_reminder_enabled: boolean;
  breakfast_time: string;
  lunch_time: string;
  dinner_time: string;
  period_reminder_enabled: boolean;
  period_reminder_days_before: number;
  notifications_paused: boolean;
}
