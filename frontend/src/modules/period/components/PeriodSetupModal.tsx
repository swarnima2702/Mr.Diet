import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Layers, Clock, Droplets } from "lucide-react";

interface PeriodSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: { cycle_length: number; period_duration: number; last_period_start: string }) => Promise<void>;
    initialData?: {
        cycle_length?: number;
        period_duration?: number;
        last_period_start?: string;
    };
}

export const PeriodSetupModal: React.FC<PeriodSetupModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [cycleLength, setCycleLength] = useState(initialData?.cycle_length?.toString() || "28");
    const [periodDuration, setPeriodDuration] = useState(initialData?.period_duration?.toString() || "5");
    const [lastPeriodStart, setLastPeriodStart] = useState(initialData?.last_period_start || "");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lastPeriodStart) return;
        setIsSaving(true);
        try {
            await onSave({
                cycle_length: parseInt(cycleLength),
                period_duration: parseInt(periodDuration),
                last_period_start: lastPeriodStart
            });
            onClose();
        } catch (err) {
            console.error("Failed to save period setup:", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] bg-[#0a0a0a] border-white/5 rounded-2xl shadow-2xl overflow-hidden p-0">
                <div className="bg-rose-500/10 p-6 border-b border-rose-500/10 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/20">
                        <Calendar className="h-5 w-5 text-rose-500" />
                    </div>
                    <div>
                        <DialogTitle className="text-lg font-bold text-white uppercase tracking-tight">Setup Your Cycle</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground font-medium">Personalize your hormonal analytics</DialogDescription>
                    </div>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-5">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="last_period" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-rose-500" /> When did your last period start?
                                </Label>
                                <Input 
                                    id="last_period" 
                                    type="date" 
                                    value={lastPeriodStart}
                                    onChange={(e) => setLastPeriodStart(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white rounded-xl h-11 px-4 placeholder:text-white/20 focus:ring-1 focus:ring-rose-500/50"
                                    required
                                />
                                <p className="text-[9px] text-white/20 font-medium px-1 italic">This date helps us accurately predict your future cycles.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="cycle_length" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Layers className="w-3 h-3 text-rose-500" /> Full Cycle Length?
                                    </Label>
                                    <div className="relative">
                                        <Input 
                                            id="cycle_length" 
                                            type="number" 
                                            min="20" 
                                            max="45"
                                            value={cycleLength}
                                            onChange={(e) => setCycleLength(e.target.value)}
                                            className="bg-white/5 border-white/10 text-white rounded-xl h-11 px-4 placeholder:text-white/20"
                                            required
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/30 uppercase">Days</span>
                                    </div>
                                    <p className="text-[8px] text-white/20 font-medium leading-tight">Total days from the start of one period to the next (Usually 28 days).</p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="period_duration" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Droplets className="w-3 h-3 text-rose-500" /> Period Duration?
                                    </Label>
                                    <div className="relative">
                                        <Input 
                                            id="period_duration" 
                                            type="number" 
                                            min="1" 
                                            max="10"
                                            value={periodDuration}
                                            onChange={(e) => setPeriodDuration(e.target.value)}
                                            className="bg-white/5 border-white/10 text-white rounded-xl h-11 px-4 placeholder:text-white/20"
                                            required
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/30 uppercase">Days</span>
                                    </div>
                                    <p className="text-[8px] text-white/20 font-medium leading-tight">Total days of bleeding during your period flow (Avg 4-6d).</p>
                                </div>
                            </div>
                        </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-11 rounded-xl text-[10px] font-bold uppercase tracking-widest border-white/5 hover:bg-white/5 text-muted-foreground">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving} className="flex-1 h-11 rounded-xl bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20 text-[10px] font-bold uppercase tracking-widest transition-all">
                            {isSaving ? "Saving..." : "Save Setup"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
