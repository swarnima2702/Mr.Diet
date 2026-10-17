import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { NotificationPreferences } from "@/lib/types/notifications";

declare global {
    interface Window {
        OneSignalDeferred: Array<(onesignal: any) => void>;
        OneSignal?: any;
    }
}

export function useNotifications(userId?: string) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isPushSupported, setIsPushSupported] = useState(false);
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Check if push notifications are supported
    useEffect(() => {
        setIsPushSupported("Notification" in window && "serviceWorker" in navigator);
    }, []);

    // Initialize OneSignal and check subscription status
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const init = async () => {
            try {
                // Fetch preferences from backend (priority ground truth)
                const prefs = await api.notifications.get(userId);
                setPreferences(prefs);

                // Check OneSignal status
                if (window.OneSignal) {
                    window.OneSignal.push(async (OneSignal: any) => {
                        const optIn = await OneSignal.User.PushSubscription.optedIn;
                        const id = OneSignal.User.PushSubscription.id;
                        
                        // If OneSignal says opted in but backend doesn't have ID, sync it
                        if (optIn && id && !prefs.onesignal_player_id) {
                            await api.notifications.registerDevice(userId, id);
                        }

                        // Set UI state based on Backend existence OR OneSignal status
                        setIsSubscribed(optIn || !!prefs.onesignal_player_id);
                    });
                } else {
                    // Fallback to backend only if SDK not loaded
                    setIsSubscribed(!!prefs.onesignal_player_id);
                }

            } catch (e) {
                console.error("[Notifications] Failed to load preferences:", e);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [userId]);

    // Request permission and subscribe
    const requestPermission = useCallback(async () => {
        if (!userId || saving) return false;

        console.log("[Notifications] Starting robust OneSignal prompt flow...");
        setSaving(true);

        try {
            if (!window.OneSignal) {
                toast.error("Notification system is being blocked by your browser or an ad-blocker. Please allow requests to OneSignal to enable notifications.");
                return false;
            }

            const playerId = await new Promise<string | null>((resolve) => {
                window.OneSignal.push(async (OneSignal: any) => {
                    try {
                        // 1. Check current status
                        const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
                        if (isOptedIn && OneSignal.User.PushSubscription.id) {
                             resolve(OneSignal.User.PushSubscription.id);
                             return;
                        }

                        // 2. Trigger native-like prompt
                        await OneSignal.Slidedown.promptPush();
                        
                        // 3. Fallback: prompt native directly if slidedown doesn't appear
                        if (Notification.permission === "default") {
                             await OneSignal.User.PushSubscription.optIn();
                        }

                        // 4. Polling for session start
                        let attempts = 0;
                        const interval = setInterval(async () => {
                            const id = OneSignal.User.PushSubscription.id;
                            attempts++;
                            if (id) {
                                clearInterval(interval);
                                resolve(id);
                            } else if (attempts > 20) {
                                clearInterval(interval);
                                resolve(null);
                            }
                        }, 1000);
                    } catch (e) {
                        console.error("[Notifications] OneSignal error:", e);
                        resolve(null);
                    }
                });
            });

            if (playerId) {
                await api.notifications.registerDevice(userId, playerId);
                setPreferences(prev => ({ ...(prev || {}), onesignal_player_id: playerId } as any));
                setIsSubscribed(true);
                toast.success("Notifications enabled!");
                return true;
            }
            
            return false;
        } catch (e) {
            console.error("[Notifications] Enable failed:", e);
            return false;
        } finally {
            setSaving(false);
        }
    }, [userId, saving]);

    // Save preferences
    const savePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
        if (!userId) return false;
        setSaving(true);
        try {
            await api.notifications.save(userId, prefs);
            setPreferences((prev) => prev ? { ...prev, ...prefs } : prefs as NotificationPreferences);
            return true;
        } catch (e) {
            console.error("[Notifications] Failed to save preferences:", e);
            return false;
        } finally {
            setSaving(false);
        }
    }, [userId]);

    // Send test notification
    const sendTest = useCallback(async () => {
        if (!userId) return false;
        try {
            await api.notifications.sendTest(userId);
            return true;
        } catch (e) {
            console.error("[Notifications] Test notification failed:", e);
            return false;
        }
    }, [userId]);

    // Unsubscribe
    const unsubscribe = useCallback(async () => {
        if (!userId) return false;
        try {
            if (window.OneSignal) {
                window.OneSignal.push(async (OneSignal: any) => {
                    await OneSignal.User.PushSubscription.optOut();
                });
            }
            await api.notifications.unregisterDevice(userId);
            setPreferences(prev => ({ ...(prev || {}), onesignal_player_id: null } as any));
            setIsSubscribed(false);
            toast.success("Notifications disabled");
            return true;
        } catch (e) {
            console.error("[Notifications] Unsubscribe failed:", e);
            return false;
        }
    }, [userId]);

    return {
        isSubscribed,
        isPushSupported,
        preferences,
        loading,
        saving,
        requestPermission,
        savePreferences,
        sendTest,
        unsubscribe,
    };
}
