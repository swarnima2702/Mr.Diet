export interface PeriodLog {
    id: number;
    user_id: number;
    log_date: string;
    is_period_day: boolean;
    flow_level: 'spotting' | 'light' | 'moderate' | 'heavy' | 'very_heavy' | null;
    symptoms: string[];
    mood: string | null;
    notes: string | null;
}

export type CyclePhase = 'period' | 'follicular' | 'ovulation' | 'luteal' | 'unknown';

export interface CycleSummary {
    last_period_start: string | null;
    next_period_date: string | null;
    cycle_length: number;
    period_duration: number;
    current_cycle_day: number | null;
    fertile_window_start: string | null;
    fertile_window_end: string | null;
    ovulation_date: string | null;
    days_until_next_period: number | null;
    current_phase: CyclePhase;
    history?: Array<{
        month: string;
        length: number;
        date: string;
    }>;
}

export interface CycleConfig {
    cycle_length: number;
    period_duration: number;
    last_period_start: string;
}
