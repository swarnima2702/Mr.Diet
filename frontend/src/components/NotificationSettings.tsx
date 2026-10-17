import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Bell, BellOff, Droplets, Utensils, Sparkles, Loader2, Send, BellRing } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationPreferences } from "@/lib/types/notifications";

interface NotificationSettingsProps {
    userData: any;
}

const NotificationSettings = ({ userData }: NotificationSettingsProps) => {
    const userId = userData?.user_id?.toString() || userData?.id?.toString();
    const rawGender = userData?.gender?.toString().toLowerCase().trim();
    const isFemale = rawGender === "women" || rawGender === "female";

    const {
        isSubscribed,
        isPushSupported,
        preferences,
        loading,
        saving,
        requestPermission,
        savePreferences,
        sendTest,
        unsubscribe,
    } = useNotifications(userId);

    const [form, setForm] = useState<Partial<NotificationPreferences>>({});

    // Sync form with loaded preferences
    useEffect(() => {
        if (preferences) {
            setForm({
                water_reminder_enabled: preferences.water_reminder_enabled,
                water_reminder_interval: preferences.water_reminder_interval,
                water_reminder_start: preferences.water_reminder_start?.substring(0, 5),
                water_reminder_end: preferences.water_reminder_end?.substring(0, 5),
                meal_reminder_enabled: preferences.meal_reminder_enabled,
                breakfast_time: preferences.breakfast_time?.substring(0, 5),
                lunch_time: preferences.lunch_time?.substring(0, 5),
                dinner_time: preferences.dinner_time?.substring(0, 5),
                period_reminder_enabled: preferences.period_reminder_enabled,
                period_reminder_days_before: preferences.period_reminder_days_before,
                notifications_paused: preferences.notifications_paused,
            });
        }
    }, [preferences]);

    // Auto-save on toggle / interval / days
    const handleToggle = async (key: string, value: boolean) => {
        const newForm = { ...form, [key]: value };
        setForm(newForm);
        await savePreferences(newForm);
    };

    // Update local state as user types
    const handleTimeChange = (key: string, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // Auto-save when user leaves the time input field
    const handleTimeBlur = async (key: string, value: string) => {
        const newForm = { ...form, [key]: value + ":00" };
        setForm(newForm);
        const ok = await savePreferences(newForm);
        if (ok) toast.success("Saved", { duration: 1200 });
    };

    const handleIntervalChange = async (value: number) => {
        const newForm = { ...form, water_reminder_interval: value };
        setForm(newForm);
        await savePreferences(newForm);
    };

    const handleDaysChange = async (value: number) => {
        const newForm = { ...form, period_reminder_days_before: value };
        setForm(newForm);
        await savePreferences(newForm);
    };

    const handleEnableNotifications = async () => {
        const success = await requestPermission();
        if (success) {
            toast.success("Notifications enabled!", { description: "You will now receive push reminders." });
        } else {
            toast.error("Failed to enable notifications", { description: "Please allow notification permission in your browser." });
        }
    };

    const handleSave = async () => {
        const success = await savePreferences(form);
        if (success) {
            toast.success("Preferences saved", { description: "Your notification settings have been updated." });
        } else {
            toast.error("Failed to save preferences");
        }
    };

    const handleTest = async () => {
        const success = await sendTest();
        if (success) {
            toast.success("Test notification sent!", { description: "Check your browser for the notification." });
        } else {
            toast.error("Failed to send test", { description: "Make sure notifications are enabled and device is registered." });
        }
    };

    const handleUnsubscribe = async () => {
        const success = await unsubscribe();
        if (success) {
            toast.success("Notifications disabled");
        } else {
            toast.error("Failed to disable notifications");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                    <Bell className="h-4.5 w-4.5 text-gold" />
                </div>
                <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest leading-none">Notification Preferences</h3>
                    <p className="text-[9px] text-muted-foreground/60 leading-none mt-1">Manage your daily push reminders.</p>
                </div>
            </div>

            {/* Push Permission */}
            {!isSubscribed ? (
                <div className="p-4 rounded-xl border border-gold/20 bg-gold/5 space-y-3">
                    <div className="flex items-center gap-2">
                        <BellRing className="h-4 w-4 text-gold" />
                        <p className="text-xs font-semibold text-white">Enable Push Notifications</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                        Allow browser notifications to receive water, meal, and period reminders.
                    </p>
                    {isPushSupported ? (
                        <Button
                            onClick={handleEnableNotifications}
                            variant="luxury"
                            className="h-9 text-[10px] font-bold tracking-widest uppercase"
                        >
                            <Bell className="mr-2 h-3.5 w-3.5" /> Enable Notifications
                        </Button>
                    ) : (
                        <p className="text-[10px] text-red-400">Your browser does not support push notifications.</p>
                    )}
                </div>
            ) : (
                <>
                    {/* Master Pause Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/30">
                        <div className="flex items-center gap-2">
                            {form.notifications_paused ? (
                                <BellOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <Bell className="h-4 w-4 text-gold" />
                            )}
                            <Label className="text-xs font-bold">
                                {form.notifications_paused ? "Notifications Paused" : "Notifications Active"}
                            </Label>
                        </div>
                        <Switch
                            checked={!form.notifications_paused}
                            onCheckedChange={(checked) => handleToggle("notifications_paused", !checked)}
                        />
                    </div>

                    {/* Water Reminder */}
                    <div className={`p-4 rounded-xl border space-y-4 transition-opacity ${form.notifications_paused ? "opacity-40 pointer-events-none" : ""} border-blue-500/20 bg-blue-500/5`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Droplets className="h-4 w-4 text-blue-400" />
                                <Label className="text-xs font-bold">Water Reminder</Label>
                            </div>
                            <Switch
                                checked={!!form.water_reminder_enabled}
                                onCheckedChange={(checked) => handleToggle("water_reminder_enabled", checked)}
                            />
                        </div>
                        {form.water_reminder_enabled && (
                            <div className="space-y-3 pl-6">
                                <div>
                                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Interval</Label>
                                    <div className="flex gap-2 mt-1">
                                        {[{ l: "30 min", v: 30 }, { l: "1 hour", v: 60 }, { l: "2 hours", v: 120 }].map((opt) => (
                                            <button
                                                key={opt.v}
                                                onClick={() => handleIntervalChange(opt.v)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${form.water_reminder_interval === opt.v ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-secondary/30 border-border/30 text-muted-foreground hover:border-border"}`}
                                            >
                                                {opt.l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Start Time</Label>
                                        <Input
                                            type="time"
                                            value={form.water_reminder_start?.substring(0, 5) || "08:00"}
                                            onChange={(e) => handleTimeChange("water_reminder_start", e.target.value)}
                                            onBlur={(e) => handleTimeBlur("water_reminder_start", e.target.value)}
                                            className="mt-1 h-9 text-xs bg-secondary/30 border-border/50"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">End Time</Label>
                                        <Input
                                            type="time"
                                            value={form.water_reminder_end?.substring(0, 5) || "22:00"}
                                            onChange={(e) => handleTimeChange("water_reminder_end", e.target.value)}
                                            onBlur={(e) => handleTimeBlur("water_reminder_end", e.target.value)}
                                            className="mt-1 h-9 text-xs bg-secondary/30 border-border/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Meal Reminder */}
                    <div className={`p-4 rounded-xl border space-y-4 transition-opacity ${form.notifications_paused ? "opacity-40 pointer-events-none" : ""} border-orange-500/20 bg-orange-500/5`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Utensils className="h-4 w-4 text-orange-400" />
                                <Label className="text-xs font-bold">Meal Reminder</Label>
                            </div>
                            <Switch
                                checked={!!form.meal_reminder_enabled}
                                onCheckedChange={(checked) => handleToggle("meal_reminder_enabled", checked)}
                            />
                        </div>
                        {form.meal_reminder_enabled && (
                            <div className="grid grid-cols-3 gap-3 pl-6">
                                <div>
                                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Breakfast</Label>
                                    <Input
                                        type="time"
                                        value={form.breakfast_time?.substring(0, 5) || "08:00"}
                                        onChange={(e) => handleTimeChange("breakfast_time", e.target.value)}
                                        onBlur={(e) => handleTimeBlur("breakfast_time", e.target.value)}
                                        className="mt-1 h-9 text-xs bg-secondary/30 border-border/50"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Lunch</Label>
                                    <Input
                                        type="time"
                                        value={form.lunch_time?.substring(0, 5) || "12:30"}
                                        onChange={(e) => handleTimeChange("lunch_time", e.target.value)}
                                        onBlur={(e) => handleTimeBlur("lunch_time", e.target.value)}
                                        className="mt-1 h-9 text-xs bg-secondary/30 border-border/50"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Dinner</Label>
                                    <Input
                                        type="time"
                                        value={form.dinner_time?.substring(0, 5) || "19:00"}
                                        onChange={(e) => handleTimeChange("dinner_time", e.target.value)}
                                        onBlur={(e) => handleTimeBlur("dinner_time", e.target.value)}
                                        className="mt-1 h-9 text-xs bg-secondary/30 border-border/50"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Period Reminder (Women only) */}
                    {isFemale && (
                        <div className={`p-4 rounded-xl border space-y-4 transition-opacity ${form.notifications_paused ? "opacity-40 pointer-events-none" : ""} border-pink-500/20 bg-pink-500/5`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-pink-400" />
                                    <Label className="text-xs font-bold">Period Reminder</Label>
                                </div>
                                <Switch
                                    checked={!!form.period_reminder_enabled}
                                    onCheckedChange={(checked) => handleToggle("period_reminder_enabled", checked)}
                                />
                            </div>
                            {form.period_reminder_enabled && (
                                <div className="pl-6">
                                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Remind me before</Label>
                                    <div className="flex gap-2 mt-1">
                                        {[1, 2, 3, 5].map((d) => (
                                            <button
                                                key={d}
                                                onClick={() => handleDaysChange(d)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${form.period_reminder_days_before === d ? "bg-pink-500/20 border-pink-500/40 text-pink-400" : "bg-secondary/30 border-border/30 text-muted-foreground hover:border-border"}`}
                                            >
                                                {d} day{d > 1 ? "s" : ""}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            variant="luxury"
                            className="flex-1 h-10 text-[10px] font-bold tracking-widest uppercase"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Preferences
                        </Button>
                        <Button
                            onClick={handleUnsubscribe}
                            variant="ghost"
                            className="h-10 text-[10px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                            <BellOff className="mr-1.5 h-3.5 w-3.5" /> Disable
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationSettings;
