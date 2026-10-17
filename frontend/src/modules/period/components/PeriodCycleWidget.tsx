import React from "react";
import { Droplets, Calendar as CalendarIcon, ChevronRight, Activity, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PeriodCycleWidgetProps {
    summary: any;
    todayLog?: any;
    onAddLog: () => void;
    onViewFull: () => void;
}

export const PeriodCycleWidgetV2: React.FC<PeriodCycleWidgetProps> = ({ summary, todayLog, onAddLog, onViewFull }) => {
    const hasData = summary && summary.current_phase;

    return (
        <Card className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-4 shadow-2xl relative overflow-hidden group hover:border-rose-500/20 transition-all duration-300">
            {/* Minimal Background Glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/[0.03] blur-[40px] rounded-full -mr-12 -mt-12 group-hover:bg-rose-500/[0.05] transition-all" />

            <div className="flex flex-col gap-4">
                {/* Top Row: Title & Full View Link */}
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                        <Droplets className="h-3 w-3 text-rose-500" />
                        <span className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase">
                            Hormonal <span className="text-rose-500">Insights</span>
                        </span>
                    </div>
                    <button onClick={onViewFull} className="group/link flex items-center gap-1.5 text-[8px] font-bold text-muted-foreground hover:text-rose-500 uppercase tracking-widest transition-colors">
                        Analytics <ChevronRight className="h-2.5 w-2.5 group-hover/link:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                {/* Middle Row: Phase & Stats (Side by Side) */}
                <div className="flex items-end justify-between relative z-10">
                    <div className="space-y-0.5">
                        <h3 className={cn(
                            "text-lg font-bold tracking-tight uppercase leading-none",
                            hasData ? "text-rose-500" : "text-white/40"
                        )}>
                            {summary?.current_phase || "Setup Required"}
                        </h3>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Your Current Phase</p>
                    </div>

                    <div className="flex items-center gap-6 pr-2">
                        <div className="text-right">
                            <div className="text-sm font-bold text-white leading-none">{summary?.current_cycle_day || "0"}</div>
                            <div className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest">Current Day</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-rose-500 leading-none">{summary?.days_until_next_period || "0"}</div>
                            <div className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest">Next Period in</div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Dynamic State (Log Button vs. Symptoms) */}
                <div className="relative z-10">
                    {!todayLog ? (
                        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                            <Button 
                                onClick={onAddLog}
                                className="flex-1 h-8 bg-rose-500/10 hover:bg-rose-500 text-white hover:text-white border border-rose-500/10 rounded-lg transition-all shadow-sm"
                            >
                                <Plus className="h-3 w-3 mr-1.5" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Log Today</span>
                            </Button>
                            <Button 
                                onClick={onViewFull}
                                variant="outline"
                                className="h-8 w-8 p-0 border-white/5 bg-white/5 hover:bg-white/10 rounded-lg group"
                            >
                                <CalendarIcon className="h-3 w-3 text-muted-foreground group-hover:text-white transition-colors" />
                            </Button>
                        </div>
                    ) : (
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2 max-w-[70%]">
                                {todayLog.is_period_day && (
                                    <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-[8px] font-bold uppercase text-rose-400 flex items-center gap-1">
                                        <Droplets className="h-2 w-2" /> Flow Active
                                    </span>
                                )}
                                {todayLog.symptoms?.slice(0, 2).map((s: string) => (
                                    <span key={s} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[8px] font-bold uppercase text-muted-foreground">
                                        {s}
                                    </span>
                                ))}
                                {todayLog.symptoms?.length > 2 && (
                                    <span className="text-[7px] font-bold text-muted-foreground/30 self-center">+{todayLog.symptoms.length - 2} More</span>
                                )}
                            </div>
                            <Button 
                                onClick={onAddLog}
                                variant="ghost"
                                className="h-7 px-2 text-[8px] font-bold uppercase tracking-widest text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/5 transition-all"
                            >
                                Edit Log
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
