import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Droplets, Thermometer, Brain, Plus, Info, Settings, History, ArrowRight } from "lucide-react";
import { usePeriodTracker } from "@/modules/period/hooks/usePeriodTracker";
import { PeriodLogModal } from "@/modules/period/components/PeriodLogModal";
import { PeriodSetupModal } from "@/modules/period/components/PeriodSetupModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Navigate } from "react-router-dom";
import UserSidebar from "@/components/UserSidebar";
import { getLogoUrl } from "../lib/api";

const PeriodTracker = () => {
    const authUser = JSON.parse(localStorage.getItem("mrdiet_auth_user") || "{}");
    const profileData = JSON.parse(localStorage.getItem("mrdiet_profile_data") || "{}");
    const userId = authUser?.user_id || authUser?.id;
    const { summary, logs, currentMonth, isFemale, saveLog, deleteLog, changeMonth, isLoading, updateCycleConfig } = usePeriodTracker(userId?.toString(), profileData?.gender);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

    if (!isFemale && !isLoading) {
        return <Navigate to="/dashboard" replace />;
    }

    const currentMonthDate = new Date(currentMonth + "-01");
    const days = eachDayOfInterval({
        start: startOfMonth(currentMonthDate),
        end: endOfMonth(currentMonthDate),
    });

    const handlePrevMonth = () => {
        const prevMonth = subMonths(currentMonthDate, 1);
        changeMonth(format(prevMonth, "yyyy-MM"));
    };

    const handleNextMonth = () => {
        const nextMonth = addMonths(currentMonthDate, 1);
        changeMonth(format(nextMonth, "yyyy-MM"));
    };

    const getLogForDate = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return logs.find(l => l.log_date === dateStr);
    };

    const isPredictedPeriod = (date: Date) => {
        if (!summary?.next_period_date || !summary?.period_duration) return false;
        const nextDate = new Date(summary.next_period_date);
        const diff = eachDayOfInterval({
            start: nextDate,
            end: new Date(nextDate.getTime() + (summary.period_duration - 1) * 86400000)
        });
        return diff.some(d => isSameDay(d, date));
    };

    const isFertile = (date: Date) => {
        if (!summary?.fertile_window_start || !summary?.fertile_window_end) return false;
        return date >= new Date(summary.fertile_window_start) && date <= new Date(summary.fertile_window_end);
    };

    const isOvulation = (date: Date) => {
        if (!summary?.ovulation_date) return false;
        return isSameDay(date, new Date(summary.ovulation_date));
    };

    const handleSignOut = () => {
        localStorage.removeItem("mrdiet_auth_user");
        window.location.href = "/auth";
    };

    const settings = JSON.parse(localStorage.getItem("app_public_settings") || "{}");
    const logoUrl = getLogoUrl(settings.logo_dark || "");

    return (
        <div className="min-h-screen bg-[#050505] text-white flex">
            <UserSidebar logoUrl={logoUrl} gender={profileData?.gender} onSignOut={handleSignOut} />
            <main className="flex-1 min-h-screen overflow-y-auto px-4 py-8 md:px-8 pt-24 lg:pt-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Header - Compact */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a0a0a] p-5 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 blur-[80px] rounded-full -mr-24 -mt-24" />
                        <div className="relative z-10 space-y-1">
                            <h1 className="text-xl font-bold tracking-tight text-white">Period <span className="text-rose-500">Tracker</span></h1>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Personal Cycle Analytics</p>
                        </div>
                        
                        <div className="flex items-center gap-3 relative z-10">
                            <Button 
                                onClick={() => setIsLogModalOpen(true)}
                                className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-[9px] uppercase tracking-wider rounded-xl h-9 px-5 shadow-lg shadow-rose-500/10 transition-all"
                            >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Log Today
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        
                        {/* Column 1: Small Calendar */}
                        <Card className="bg-[#0a0a0a] border-white/5 rounded-2xl p-4 shadow-xl h-fit">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-3.5 w-3.5 text-rose-500" />
                                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-white/90">{format(currentMonthDate, "MMMM yyyy")}</h2>
                                </div>
                                <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/5">
                                    <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7 hover:bg-white/5 rounded-lg"><ChevronLeft className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7 hover:bg-white/5 rounded-lg"><ChevronRight className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                    <div key={`${d}-${i}`} className="text-center text-[8px] font-bold text-muted-foreground/30 uppercase tracking-tighter mb-1">{d}</div>
                                ))}
                                {Array.from({ length: startOfMonth(currentMonthDate).getDay() }).map((_, i) => (
                                    <div key={`empty-${i}`} />
                                ))}
                                {days.map(day => {
                                    const log = getLogForDate(day);
                                    const isPeriod = log?.is_period_day;
                                    const isPredicted = isPredictedPeriod(day);
                                    const isFertileDay = isFertile(day);
                                    const isOvDay = isOvulation(day);
                                    const isSelected = isSameDay(day, selectedDate);
                                    const isTod = isToday(day);

                                    return (
                                        <button
                                            key={day.toString()}
                                            onClick={() => setSelectedDate(day)}
                                            className={cn(
                                                "relative aspect-square flex flex-col items-center justify-center rounded-lg transition-all border border-transparent",
                                                isSelected ? "border-rose-500/50 bg-rose-500/10 shadow-lg scale-95" : "hover:bg-white/[0.03]",
                                                isTod && !isSelected && "border-white/10"
                                            )}
                                        >
                                            <span className={cn("text-[10px] font-bold", isTod ? "text-rose-400" : "text-white/60")}>{format(day, "d")}</span>
                                            <div className="absolute bottom-1 flex gap-0.5">
                                                {isPeriod && <div className="w-0.5 h-0.5 rounded-full bg-rose-500" />}
                                                {isPredicted && !isPeriod && <div className="w-0.5 h-0.5 rounded-full bg-rose-500/20" />}
                                                {isFertileDay && <div className="w-0.5 h-0.5 rounded-full bg-emerald-500/60" />}
                                                {isOvDay && <div className="w-0.5 h-0.5 rounded-full bg-blue-500/60" />}
                                            </div>
                                            {isFertileDay && <div className="absolute inset-0 bg-emerald-500/[0.01] rounded-lg -z-10" />}
                                            {isPeriod && <div className="absolute inset-0 bg-rose-500/[0.03] rounded-lg -z-10" />}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap gap-2.5 items-center justify-center">
                                {[
                                    { color: 'bg-rose-500', label: 'Period' },
                                    { color: 'bg-rose-500/30', label: 'Predicted' },
                                    { color: 'bg-emerald-500', label: 'Fertile' },
                                    { color: 'bg-blue-500 ring-1 ring-blue-500/20', label: 'Ovulation' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-1 text-[7.5px] font-bold text-muted-foreground uppercase tracking-widest">
                                        <div className={cn("w-1.5 h-1.5 rounded-full", item.color)} /> {item.label}
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Column 2: Status Details */}
                        <div className="space-y-5">
                            <Card className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 relative overflow-hidden group shadow-xl">
                                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Droplets className="h-10 w-10 text-rose-500" />
                                </div>
                                <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mb-3">Today's Insight</p>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xl font-bold text-white tracking-tight uppercase">
                                            {summary?.current_phase ? summary.current_phase : (
                                                <Button 
                                                    variant="ghost" 
                                                    className="h-auto p-0 text-rose-500 hover:text-rose-400 font-bold transition-all flex items-center gap-2 group"
                                                    onClick={() => setIsSetupModalOpen(true)}
                                                >
                                                    Tap to Setup Cycle <ArrowRight className="w-4 h-4 group-hover:translate-x-1" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider pt-0.5">Current Hormone Phase</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                                        <div>
                                            <div className="text-lg font-bold text-white">{summary?.current_cycle_day || "--"}</div>
                                            <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Day of Cycle (Current)</div>
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-rose-500">{summary?.days_until_next_period || "--"}</div>
                                            <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Days Left (Next)</div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 shadow-xl h-fit">
                                <div className="flex items-center gap-2 mb-4">
                                    <History className="h-3.5 w-3.5 text-rose-500" />
                                    <h2 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Historical Trend</h2>
                                </div>
                                <div className="space-y-4">
                                    {(summary?.history && summary.history.length > 0) ? (
                                        <div className="space-y-4">
                                            <div className="flex items-end justify-between gap-2 h-24 px-2 pt-2">
                                                {summary.history.map((h, i) => (
                                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-default">
                                                        <div className="relative w-full flex items-end justify-center h-full">
                                                            <div 
                                                                className="w-full max-w-[24px] bg-rose-500/20 group-hover:bg-rose-500/40 rounded-t-lg transition-all relative"
                                                                style={{ height: `${(h.length / 45) * 100}%` }}
                                                            >
                                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-10">
                                                                    {h.length} Days
                                                                </div>
                                                                <div className="absolute inset-0 bg-gradient-to-t from-rose-500/10 to-transparent" />
                                                            </div>
                                                        </div>
                                                        <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-tighter">{h.month}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500/40" />
                                                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Average: {summary.cycle_length} Days</span>
                                                </div>
                                                <span className="text-[8px] font-bold text-rose-500/60 uppercase tracking-widest">Recent Trends</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                                            <p className="text-[9px] px-4 text-muted-foreground font-medium leading-relaxed">Detailed history will appear here once you log two periods.</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Column 3: Log Details */}
                        <div className="space-y-5">
                            <Card className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 shadow-xl h-fit">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Day Highlights</h3>
                                    <div className="text-[9px] font-bold text-white/30">{format(selectedDate, "MMM d, yyyy")}</div>
                                </div>
                                {getLogForDate(selectedDate) ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                                            <Droplets className={cn("h-4 w-4", getLogForDate(selectedDate)?.is_period_day ? "text-rose-500" : "text-white/10")} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                                {getLogForDate(selectedDate)?.is_period_day ? "Active Period" : "No Period"}
                                            </span>
                                        </div>
                                        {getLogForDate(selectedDate)?.symptoms?.length ? (
                                            <div className="space-y-2">
                                                <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Logged Symptoms</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {getLogForDate(selectedDate)?.symptoms.map(s => (
                                                        <span key={s} className="px-2 py-0.5 bg-rose-500/5 border border-rose-500/10 rounded-md text-[8px] font-bold uppercase text-rose-400">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}
                                        <div className="flex flex-col gap-2">
                                            <Button 
                                                variant="outline" 
                                                className="w-full bg-rose-500/10 hover:bg-rose-500 text-white border border-rose-500/20 rounded-xl text-[9px] font-bold uppercase tracking-widest h-10 transition-all hover:scale-[1.02]"
                                                onClick={() => {
                                                    setSelectedDate(selectedDate);
                                                    setIsLogModalOpen(true);
                                                }}
                                            >
                                                Edit Entry Details
                                            </Button>
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    className="flex-1 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/5 text-[9px] font-bold uppercase tracking-widest h-10 border border-white/5 rounded-xl"
                                                    onClick={() => deleteLog(format(selectedDate, "yyyy-MM-dd"))}
                                                >
                                                    Delete Log
                                                </Button>
                                                <Button 
                                                    variant="outline"
                                                    className="h-10 w-10 p-0 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-muted-foreground/40 hover:text-rose-500"
                                                    onClick={() => setIsSetupModalOpen(true)}
                                                >
                                                    <Settings className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 space-y-4">
                                        <div className="h-8 w-8 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                            <Plus className="h-4 w-4 text-white/20" />
                                        </div>
                                        <p className="text-[9px] font-medium text-muted-foreground">No logs for this date.</p>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline" 
                                                className="flex-1 h-9 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-[9px] font-bold tracking-widest uppercase"
                                                onClick={() => {
                                                    setSelectedDate(selectedDate);
                                                    setIsLogModalOpen(true);
                                                }}
                                            >
                                                <Plus className="h-4 w-4 mr-1.5 text-rose-500" />
                                                Log Today
                                            </Button>
                                            <Button 
                                                variant="outline"
                                                className="h-9 w-9 p-0 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-muted-foreground/40 hover:text-rose-500"
                                                onClick={() => setIsSetupModalOpen(true)}
                                            >
                                                <Settings className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>

                             {/* Footer cleanup - Settings moved to header */}
                        </div>
                    </div>
                </div>

                {isLogModalOpen && (
                    <PeriodLogModal 
                        onClose={() => setIsLogModalOpen(false)}
                        onSave={saveLog}
                        logDate={format(selectedDate, "yyyy-MM-dd")}
                        existingLog={getLogForDate(selectedDate)}
                    />
                )}
                {isSetupModalOpen && (
                    <PeriodSetupModal 
                        isOpen={isSetupModalOpen}
                        onClose={() => setIsSetupModalOpen(false)}
                        onSave={updateCycleConfig}
                        initialData={summary ? {
                            cycle_length: summary.cycle_length,
                            period_duration: summary.period_duration,
                            last_period_start: summary.last_period_start
                        } : undefined}
                    />
                )}
            </main>
        </div>
    );
};

export default PeriodTracker;
