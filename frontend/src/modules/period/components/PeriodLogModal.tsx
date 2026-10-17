import React, { useState } from "react";
import { X, Droplets } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PeriodLog } from "@/lib/types/period";

interface PeriodLogModalProps {
    logDate: string;
    existingLog?: PeriodLog | null;
    onSave: (logData: Omit<PeriodLog, 'id'>) => Promise<void>;
    onClose: () => void;
}

const FLOW_OPTIONS = [
    { value: 'spotting', label: 'Spotting' },
    { value: 'light', label: 'Light' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'heavy', label: 'Heavy' },
    { value: 'very_heavy', label: 'Very Heavy' },
];

const SYMPTOM_OPTIONS = [
    'Cramps', 'Headache', 'Bloating', 'Fatigue', 'Mood swings',
    'Back pain', 'Breast tenderness', 'Acne', 'Nausea'
];

const MOOD_OPTIONS = ['Happy', 'Sad', 'Anxious', 'Irritable', 'Calm', 'Energetic', 'Tired'];

export const PeriodLogModal: React.FC<PeriodLogModalProps> = ({
    logDate,
    existingLog,
    onSave,
    onClose
}) => {
    const [isPeriodDay, setIsPeriodDay] = useState(existingLog?.is_period_day ?? false);
    const [flowLevel, setFlowLevel] = useState<string | null>(existingLog?.flow_level ?? null);
    const [symptoms, setSymptoms] = useState<string[]>(existingLog?.symptoms ?? []);
    const [mood, setMood] = useState<string | null>(existingLog?.mood ?? null);
    const [notes, setNotes] = useState(existingLog?.notes ?? '');
    const [isSaving, setIsSaving] = useState(false);

    const toggleSymptom = (symptom: string) => {
        setSymptoms(prev =>
            prev.includes(symptom)
                ? prev.filter(s => s !== symptom)
                : [...prev, symptom]
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave({
            user_id: 0,
            log_date: logDate,
            is_period_day: isPeriodDay,
            flow_level: isPeriodDay ? flowLevel as any : null,
            symptoms,
            mood,
            notes: notes || null
        });
        setIsSaving(false);
        onClose();
    };

    const formattedDate = new Date(logDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <Card className="w-full max-w-md bg-background border-gold/20 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Droplets className="h-5 w-5 text-rose-400" />
                        Log Period
                    </CardTitle>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </CardHeader>
                <CardContent className="space-y-5">
                    <p className="text-sm text-muted-foreground">{formattedDate}</p>

                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Period Day?</label>
                        <button
                            onClick={() => setIsPeriodDay(!isPeriodDay)}
                            className={`w-12 h-6 rounded-full transition-all ${isPeriodDay ? 'bg-rose-500' : 'bg-white/10'}`}
                        >
                            <div className={`w-5 h-5 rounded-full bg-white transition-all ${isPeriodDay ? 'translate-x-6' : 'translate-x-0.5'}`} />
                        </button>
                    </div>

                    {isPeriodDay && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Flow Level</label>
                            <div className="grid grid-cols-3 gap-2">
                                {FLOW_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFlowLevel(opt.value)}
                                        className={`p-2 text-xs rounded-md border-2 transition-all ${
                                            flowLevel === opt.value
                                                ? 'border-rose-400 bg-rose-400/10 text-rose-300 font-bold'
                                                : 'border-border hover:border-rose-400/30'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Symptoms</label>
                        <div className="grid grid-cols-3 gap-2">
                            {SYMPTOM_OPTIONS.map(symptom => (
                                <button
                                    key={symptom}
                                    onClick={() => toggleSymptom(symptom)}
                                    className={`p-2 text-xs rounded-md border-2 transition-all ${
                                        symptoms.includes(symptom)
                                            ? 'border-gold bg-gold/10 text-gold-dark font-bold'
                                            : 'border-border hover:border-gold/30'
                                    }`}
                                >
                                    {symptom}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mood</label>
                        <div className="grid grid-cols-4 gap-2">
                            {MOOD_OPTIONS.map(m => (
                                <button
                                    key={m}
                                    onClick={() => setMood(mood === m ? null : m)}
                                    className={`p-2 text-xs rounded-md border-2 transition-all ${
                                        mood === m
                                            ? 'border-gold bg-gold/10 text-gold-dark font-bold'
                                            : 'border-border hover:border-gold/30'
                                    }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Notes</label>
                        <textarea
                            className="w-full p-3 rounded-md border border-input bg-background h-20 resize-none focus:outline-none focus:ring-1 focus:ring-gold text-sm"
                            placeholder="Any additional notes..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="luxury"
                            className="flex-1"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Log'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
