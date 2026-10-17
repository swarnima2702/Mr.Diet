import { useEffect } from "react";
import { useAppConfig } from "@/hooks/useAppConfig";

declare global {
    interface Window {
        OneSignalDeferred: Array<(onesignal: any) => void>;
        OneSignal?: any;
    }
}

/**
 * Hook to initialize OneSignal with dynamic App ID from config
 * This should be called once at app root level
 */
export function useOneSignalInit() {
    const config = useAppConfig();
    const oneSignalAppId = config?.onesignal_app_id;

    useEffect(() => {
        if (!oneSignalAppId) return;

        // A OneSignal web app is tied to its production origin. Loading that
        // configuration on localhost creates a noisy domain-mismatch error and
        // does not provide usable push notifications anyway.
        if (['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)) {
            return;
        }

        // Dynamically inject the SDK script
        const loadSDK = () => new Promise<void>((resolve, reject) => {
            if (document.getElementById('onesignal-sdk')) {
                resolve(); 
                return;
            }
            const script = document.createElement('script');
            script.id = 'onesignal-sdk';
            script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js?v=2';
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => {
                console.error('[OneSignal] SDK script blocked or failed to load. Likely an ad-blocker.');
                reject(new Error('OneSignal SDK blocked'));
            };
            document.head.appendChild(script);
        });

        const init = async () => {
            try {
                await loadSDK();
                window.OneSignalDeferred = window.OneSignalDeferred || [];
                window.OneSignalDeferred.push(async (OneSignal: any) => {
                    if (OneSignal.initialized) return;
                    try {
                        await OneSignal.init({
                            appId: oneSignalAppId,
                            notifyButton: { enable: false },
                            allowLocalhostAsSecureOrigin: true,
                            serviceWorkerParam: { scope: "/" },
                            serviceWorkerPath: "OneSignalSDKWorker.js",
                        });
                        console.info('[OneSignal] Initialized successfully');
                    } catch (error: any) {
                        if (!error.message?.includes('already initialized')) {
                            console.error('[OneSignal] Initialization failed:', error);
                        }
                    }
                });
            } catch (e) {
                // Silently fail or log for analytics - don't crash the app
            }
        };

        init();
    }, [oneSignalAppId]);
}
