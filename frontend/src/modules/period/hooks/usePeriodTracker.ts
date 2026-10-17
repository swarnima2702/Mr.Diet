import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PeriodLog, CycleSummary } from "@/lib/types/period";

export const usePeriodTracker = (userId: string | undefined, gender?: string) => {
    const [summary, setSummary] = useState<CycleSummary | null>(null);
    const [logs, setLogs] = useState<PeriodLog[]>([]);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [isLoading, setIsLoading] = useState(false);

    // Strict female check - Must be "women" or "female"
    const isFemale = (gender?.toString().toLowerCase().trim() === "women" || gender?.toString().toLowerCase().trim() === "female");

    const fetchSummary = useCallback(async () => {
        if (!userId) return;
        try {
            const data = await api.periodTracker.getSummary(userId);
            setSummary(data);
        } catch (err: any) {
            console.error("Failed to fetch cycle summary:", err);
        }
    }, [userId]);

    const fetchLogs = useCallback(async (month?: string) => {
        if (!userId) return;
        const targetMonth = month || currentMonth;
        setIsLoading(true);
        try {
            const data = await api.periodTracker.getLogs(userId, targetMonth);
            setLogs(data);
        } catch (err: any) {
            console.error("Failed to fetch period logs:", err);
        } finally {
            setIsLoading(false);
        }
    }, [userId, currentMonth]);

    useEffect(() => {
        if (userId && isFemale) {
            fetchSummary();
            fetchLogs();
        }
    }, [userId, isFemale, fetchSummary, fetchLogs]);

    const saveLog = async (logData: Omit<PeriodLog, 'id'>) => {
        if (!userId) return;
        try {
            const result = await api.periodTracker.saveLog({
                user_id: userId,
                log_date: logData.log_date,
                is_period_day: logData.is_period_day,
                flow_level: logData.flow_level,
                symptoms: logData.symptoms,
                mood: logData.mood,
                notes: logData.notes
            });
            if (result.summary) {
                setSummary(result.summary);
            }
            await fetchLogs();
            toast.success("Period log saved");
        } catch (err: any) {
            toast.error(err.message || "Failed to save log");
        }
    };

    const deleteLog = async (logDate: string) => {
        if (!userId) return;
        try {
            const result = await api.periodTracker.deleteLog(userId, logDate);
            if (result.summary) {
                setSummary(result.summary);
            }
            await fetchLogs();
            toast.success("Period log deleted");
        } catch (err: any) {
            toast.error(err.message || "Failed to delete log");
        }
    };

    const updateCycleConfig = async (config: { cycle_length: number; period_duration: number; last_period_start: string }) => {
        if (!userId) return;
        try {
            const result = await api.periodTracker.updateCycleConfig(userId, config);
            if (result.summary) {
                setSummary(result.summary);
            }
            // Re-fetch logs too just in case predictions changed significantly
            await fetchLogs();
            toast.success("Cycle configuration updated");
        } catch (err: any) {
            toast.error(err.message || "Failed to update cycle config");
        }
    };

    const changeMonth = (month: string) => {
        setCurrentMonth(month);
        fetchLogs(month);
    };

    return {
        summary,
        logs,
        currentMonth,
        isLoading,
        isFemale,
        saveLog,
        deleteLog,
        updateCycleConfig,
        changeMonth,
        refresh: () => {
            fetchSummary();
            fetchLogs();
        }
    };
};
