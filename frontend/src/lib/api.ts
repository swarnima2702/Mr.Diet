export const API_BASE_URL = "/api/controllers";

export const GOOGLE_CLIENT_ID = "785889991022-6jfg7dqe45cfecf1n0e3kubor89lof3p.apps.googleusercontent.com";

export const getEnableDummyData = () => (window as any).APP_CONFIG?.enableDummyData === "1";
export const getEnableRegenerate = () => (window as any).APP_CONFIG?.enableRegenerate === "1";

export const syncConfig = (newConfig: any) => {
    (window as any).APP_CONFIG = newConfig;
    localStorage.setItem("app_public_settings", JSON.stringify(newConfig));
    window.dispatchEvent(new Event("config-updated"));
};

// Anti-Caching Helpers
const getHeaders = (extraHeaders = {}) => ({
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    ...extraHeaders
});

const getUrl = (url: string) => {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}_t=${Date.now()}`;
};

// Feature Flags
// These will be updated by syncConfig

export const getLogoUrl = (logoPath: string | File) => {
    if (!logoPath) return "";
    if (typeof logoPath !== "string") return URL.createObjectURL(logoPath);
    if (logoPath.startsWith("http") || logoPath.startsWith("data:")) return logoPath;
    // Remove leading slash if exists
    const cleanPath = logoPath.startsWith("/") ? logoPath.substring(1) : logoPath;
    return `${API_BASE_URL}/../${cleanPath}`;
};

interface User {
    id?: string;
    userId?: string;
    phone?: string;
    name?: string;
    email?: string;
}

export const api = {
    auth: {
        signup: async (email: string, password: string, name: string, referralCode?: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/auth.php?action=signup`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ email, password, data: { name, referral_code: referralCode } }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || error.error || "Signup failed");
            }
            return response.json();
        },
        login: async (email: string, password: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/auth.php?action=login`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ email, password }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || error.error || "Login failed");
            }
            return response.json();
        },
        googleLogin: async (credential: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/auth.php?action=verify_google`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ credential }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || error.error || "Google login failed");
            }
            return response.json();
        },
        googleLoginManual: async (userInfo: unknown) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/auth.php?action=verify_google_manual`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(userInfo),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || error.error || "Google login failed");
            }
            return response.json();
        }
    },
    payment: {
        createOrder: async (
            amount: number,
            user: User,
            gateway: "cashfree" | "razorpay" = "cashfree",
            extras: { coupon_code?: string; plan_type?: string } = {}
        ) => {
            // Cashfree PROD requires HTTPS; sandbox + localhost dev work over HTTP.
            // Only force https for real (non-localhost) origins.
            let returnUrl = `${window.location.origin}/dashboard?order_id={order_id}`;
            const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(returnUrl);
            if (returnUrl.startsWith("http:") && !isLocalhost) {
                returnUrl = returnUrl.replace("http:", "https:");
            }

            const response = await fetch(getUrl(`${API_BASE_URL}/payment.php?action=create_order`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    amount,
                    gateway,
                    customer_id: user.id || user.userId || 'GUEST',
                    customer_phone: user.phone,
                    customer_name: user.name,
                    customer_email: user.email,
                    return_url: returnUrl,
                    coupon_code: extras.coupon_code || "",
                    plan_type: extras.plan_type || "",
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || error.error || "Payment initiation failed");
            }
            return response.json();
        },
        verifyOrder: async (orderId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/payment.php?action=verify`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ gateway: "cashfree", order_id: orderId }),
            });
            return response.json();
        },
        verifyRazorpay: async (payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/payment.php?action=verify`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ gateway: "razorpay", ...payload }),
            });
            return response.json();
        }
    },
    profiles: {
        create: async (profileData: unknown) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/profiles.php`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(profileData),
            });
            if (!response.ok) {
                const text = await response.text();
                let errMsg = "Failed to process request";
                try {
                    const err = JSON.parse(text);
                    errMsg = err.message || err.error || errMsg;
                } catch(e) {}
                console.error("API Error Result:", text);
                throw new Error(errMsg);
            }
            const text = await response.text();
            try { return text ? JSON.parse(text) : null; }
            catch(e) { throw new Error("Invalid response format"); }
        },
        getByUserId: async (userId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/profiles.php?user_id=${userId}`), {
                method: "GET",
                headers: getHeaders(),
            });
            if (response.status === 404) {
                return null;
            }
            if (!response.ok) {
                const text = await response.text();
                let errorMessage = "Failed to fetch profile";
                try {
                    const error = JSON.parse(text);
                    errorMessage = error.message || error.error || errorMessage;
                } catch (e) { }
                throw new Error(errorMessage);
            }
            const text = await response.text();
            try {
                return text ? JSON.parse(text) : null;
            } catch (e) {
                console.error("Invalid JSON from profiles:", text);
                throw new Error("Server returned invalid JSON");
            }
        },
        update: async (userId: string, data: any) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/profiles.php`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ action: 'update', user_id: userId, ...data })
            });
            return response.json();
        }
    },
    subscriptions: {
        create: async (subscriptionData: unknown) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/subscriptions.php`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(subscriptionData),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || error.error || "Failed to create subscription");
            }
            return response.json();
        },
        update: async (id: string, data: unknown) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/subscriptions.php?id=${id}`), {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || error.error || "Failed to update subscription");
            }
            return response.json();
        },
        getActiveByUserId: async (userId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/subscriptions.php?user_id=${userId}`), {
                method: "GET",
                headers: getHeaders(),
            });
            if (response.status === 404) {
                return null;
            }
            if (!response.ok) {
                const text = await response.text();
                // If 404, it might just mean no subscription, which isn't an "error" for the caller?
                // But existing logic seemed to treat it as error. Let's keep throwing but safe parse.
                let errorMessage = "Failed to fetch subscription";
                try {
                    const error = JSON.parse(text);
                    errorMessage = error.message || error.error || errorMessage;
                } catch (e) { }
                throw new Error(errorMessage);
            }
            const text = await response.text();
            try {
                return text ? JSON.parse(text) : null;
            } catch (e) {
                console.error("Invalid JSON from subscriptions:", text);
                throw new Error("Server returned invalid JSON for subscription");
            }
        },
        getAllByUserId: async (userId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/subscriptions.php?user_id=${userId}&all=true`), {
                method: "GET",
                headers: getHeaders(),
            });
            if (!response.ok) {
                return [];
            }
            return response.json();
        },
        previewChange: async (userId: string, newPlan: string) => {
            const r = await fetch(getUrl(`${API_BASE_URL}/subscriptions.php?action=preview_change&user_id=${userId}&new_plan=${encodeURIComponent(newPlan)}`), {
                headers: getHeaders(),
            });
            return r.json();
        }
    },
    dietPlans: {
        createBatch: async (plans: unknown[]) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/daily_diet_plans.php`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(plans),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || error.error || "Failed to create diet plans");
            }
            return response.json();
        },
        getBySubscription: async (subscriptionId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/daily_diet_plans.php?subscription_id=${subscriptionId}`), {
                method: "GET",
                headers: getHeaders(),
            });
            if (!response.ok) {
                const text = await response.text();
                let errorMessage = "Failed to fetch diet plans";
                try {
                    const error = JSON.parse(text);
                    errorMessage = error.message || error.error || errorMessage;
                } catch (e) { }
                throw new Error(errorMessage);
            }
            const text = await response.text();
            try {
                return text ? JSON.parse(text) : [];
            } catch (e) {
                console.error("Invalid JSON from diet plans:", text);
                throw new Error("Server returned invalid JSON for diet plans");
            }
        },
        unlock: async (subscriptionId: string, dayNumber: number, mealPlan: unknown, isUnlocked: boolean = true) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/daily_diet_plans.php?subscription_id=${subscriptionId}&day_number=${dayNumber}`), {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify({
                    is_unlocked: isUnlocked,
                    unlocked_at: isUnlocked ? new Date().toISOString() : null,
                    meal_plan: mealPlan
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || error.error || "Failed to update plan status");
            }
            return response.json();
        },
        generate: async (userProfile: unknown, dayNumber: number, planType: string, language?: string, notes?: string, subscriptionId?: number | string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/generate_plan.php`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    userProfile,
                    dayNumber, // Note: using dayNumber instead of day_number to match PHP
                    planType,
                    language,
                    notes,
                    subscription_id: subscriptionId
                }),
            });
            if (!response.ok) {
                const text = await response.text();
                console.error("[Diet API] Backend Error Output:", text);
                try {
                    const error = JSON.parse(text);
                    throw new Error(error.message || error.error || "Failed to generate plan");
                } catch(e) {
                    throw new Error("Server Error: " + text.substring(0, 100)); // Surface raw PHP error to frontend
                }
            }
            return response.json();
        },
        checkIn: async (data: { subscription_id: string, day_number: number, weight?: number, mood?: string, notes?: string }) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/checkin.php`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || error.error || "Check-in failed");
            }
            return response.json();
        },
        substituteMeal: async (data: {
            subscription_id: number;
            day_number: number;
            meal_index: number;
            user_has: string;
            target_macros: { calories: number; protein: number; carbs: number; fat: number };
        }) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/generate_plan.php`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ action: "substitute_meal", ...data }),
            });
            if (!response.ok) {
                const text = await response.text();
                try {
                    const error = JSON.parse(text);
                    throw new Error(error.message || error.error || "Substitution failed");
                } catch (e) {
                    throw new Error("Server Error: " + text.substring(0, 100));
                }
            }
            return response.json();
        }
    },
    timers: {
        get: async (subscriptionId: string, dayNumber: number) => {
            try {
                const response = await fetch(getUrl(`${API_BASE_URL}/timers.php?subscription_id=${subscriptionId}&day_number=${dayNumber}`), {
                    headers: getHeaders()
                });
                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.error || `Failed to fetch timer (${response.status})`);
                }
                const json = await response.json();
                return json.timer;
            } catch (e) {
                console.error("Timer Get Error:", e);
                return null;
            }
        },
        create: async (subscriptionId: string, dayNumber: number, unlockAt: number) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/timers.php`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ subscription_id: subscriptionId, day_number: dayNumber, unlock_at: unlockAt })
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || "Failed to create timer");
            }
        },
        delete: async (subscriptionId: string, dayNumber: number) => {
            await fetch(getUrl(`${API_BASE_URL}/timers.php?subscription_id=${subscriptionId}&day_number=${dayNumber}`), {
                method: "DELETE",
                headers: getHeaders()
            });
        }
    },
    admin: {
        getAnalytics: async (adminId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/admin/analytics.php?admin_id=${adminId}`), {
                headers: getHeaders()
            });
            return response.json();
        },
        getUsers: async (adminId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/admin/users.php?admin_id=${adminId}`), {
                headers: getHeaders()
            });
            return response.json();
        },
        changeUserPlan: async (adminId: string, userId: string, planType: "daily" | "weekly" | "monthly") => {
            const response = await fetch(getUrl(`${API_BASE_URL}/admin/users.php?admin_id=${adminId}&action=change_plan`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ user_id: userId, plan_type: planType })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || error.error || "Failed to change user plan");
            }
            return response.json();
        },
        getUserProfiles: async (adminId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/admin/profiles.php?admin_id=${adminId}`), {
                headers: getHeaders()
            });
            return response.json();
        },
        getUserProfile: async (adminId: string, profileId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/admin/profiles.php?admin_id=${adminId}&id=${profileId}`), {
                headers: getHeaders()
            });
            return response.json();
        },
        updateUserProfile: async (adminId: string, profileId: string, data: any) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/admin/profiles.php`), {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify({ admin_id: adminId, id: profileId, ...data })
            });
            return response.json();
        },
        deleteUserProfile: async (adminId: string, profileId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/admin/profiles.php?admin_id=${adminId}&id=${profileId}`), {
                method: "DELETE",
                headers: getHeaders()
            });
            return response.json();
        },
        getHealthMetrics: async (adminId: string, profileId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/admin/health_metrics.php?admin_id=${adminId}&profile_id=${profileId}`), {
                headers: getHeaders()
            });
            return response.json();
        },
        updateHealthMetrics: async (adminId: string, profileId: string, data: any) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/admin/health_metrics.php`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ admin_id: adminId, profile_id: profileId, ...data })
            });
            return response.json();
        },
        getSettings: async (adminId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/admin/settings.php?admin_id=${adminId}`), {
                headers: getHeaders()
            });
            return response.json();
        },
        updateSettings: async (adminId: string, settings: any) => {
            const formData = new FormData();
            formData.append('admin_id', adminId);

            Object.keys(settings).forEach(key => {
                if (settings[key] !== null && settings[key] !== undefined) {
                    formData.append(key, settings[key]);
                }
            });

            const response = await fetch(getUrl(`${API_BASE_URL}/admin/settings.php`), {
                method: "POST",
                body: formData // Note: browser sets multipart/form-data for FormData
            });
            return response.json();
        },
        getWithdrawals: async (adminId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/admin/withdrawals.php?admin_id=${adminId}`), {
                headers: getHeaders()
            });
            return response.json();
        },
        processWithdrawal: async (adminId: string, formData: FormData) => {
            formData.append('admin_id', adminId);
            const response = await fetch(getUrl(`${API_BASE_URL}/admin/withdrawals.php`), {
                method: "POST",
                body: formData
            });
            return response.json();
        },
        getPage: async (slug: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/admin/cms.php?slug=${slug}`), {
                headers: getHeaders()
            });
            return response.json();
        },
        savePage: async (adminId: string, pageData: any) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/admin/cms.php`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ admin_id: adminId, ...pageData })
            });
            return response.json();
        },
        adjustBalance: async (adminId: string, userId: string, amount: number, type: 'add' | 'remove', description: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/admin/adjust_balance.php`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ admin_id: adminId, user_id: userId, amount, type, description })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || error.error || "Failed to adjust balance");
            }
            return response.json();
        },
        coupons: {
            list: async (adminId: string) => {
                const r = await fetch(getUrl(`${API_BASE_URL}/admin/coupons.php?admin_id=${adminId}`), { headers: getHeaders() });
                return r.json();
            },
            create: async (adminId: string, data: any) => {
                const r = await fetch(getUrl(`${API_BASE_URL}/admin/coupons.php`), {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({ admin_id: adminId, ...data }),
                });
                if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Failed to create coupon"); }
                return r.json();
            },
            update: async (adminId: string, id: number | string, data: any) => {
                const r = await fetch(getUrl(`${API_BASE_URL}/admin/coupons.php?id=${id}`), {
                    method: "PATCH",
                    headers: getHeaders(),
                    body: JSON.stringify({ admin_id: adminId, ...data }),
                });
                if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Failed to update coupon"); }
                return r.json();
            },
            remove: async (adminId: string, id: number | string) => {
                const r = await fetch(getUrl(`${API_BASE_URL}/admin/coupons.php?admin_id=${adminId}&id=${id}`), {
                    method: "DELETE",
                    headers: getHeaders(),
                });
                return r.json();
            },
            analytics: async (adminId: string) => {
                const r = await fetch(getUrl(`${API_BASE_URL}/admin/coupons.php?action=analytics&admin_id=${adminId}`), { headers: getHeaders() });
                return r.json();
            },
        },
        transactions: {
            list: async (adminId: string, opts: { status?: string; gateway?: string; q?: string } = {}) => {
                const qs = new URLSearchParams({ admin_id: adminId, ...(opts as any) }).toString();
                const r = await fetch(getUrl(`${API_BASE_URL}/admin/transactions.php?${qs}`), { headers: getHeaders() });
                return r.json();
            },
            updateStatus: async (adminId: string, payload: { id: number | string; payment_status: string; transaction_id?: string; admin_note?: string }) => {
                const r = await fetch(getUrl(`${API_BASE_URL}/admin/transactions.php?admin_id=${adminId}`), {
                    method: "PATCH",
                    headers: getHeaders(),
                    body: JSON.stringify({ admin_id: adminId, ...payload }),
                });
                if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Update failed"); }
                return r.json();
            },
        }
    },
    coupons: {
        validate: async (code: string, plan_type: string, amount: number) => {
            const r = await fetch(getUrl(`${API_BASE_URL}/coupons.php?action=validate`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ code, plan_type, amount }),
            });
            return r.json();
        }
    },
    config: {
        fetchPublic: async () => {
            const response = await fetch(getUrl(`${API_BASE_URL}/settings_public.php`), {
                headers: getHeaders()
            });
            return response.json();
        }
    },
    referral: {
        getStats: async (userId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/partner.php?action=stats&user_id=${userId}`), {
                headers: getHeaders()
            });
            return response.json();
        },
        requestWithdrawal: async (userId: string, amount: number) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/partner.php`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ action: 'payout_request', user_id: userId, amount })
            });
            return response.json();
        }
    },
    partner: {
        getStats: async (userId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/partner.php?action=stats&user_id=${userId}`), {
                headers: getHeaders()
            });
            return response.json();
        },
        getHistory: async (userId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/partner.php?action=stats&user_id=${userId}`), {
                headers: getHeaders()
            });
            return response.json();
        },
        requestPayout: async (userId: string, amount: number) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/partner.php`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ action: 'payout_request', user_id: userId, amount })
            });
            return response.json();
        }
    },
    periodTracker: {
        getLogs: async (userId: string, month: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/period_tracker.php?user_id=${userId}&action=logs&month=${month}`), {
                headers: getHeaders()
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to fetch period logs");
            }
            return response.json();
        },
        getSummary: async (userId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/period_tracker.php?user_id=${userId}&action=summary`), {
                headers: getHeaders()
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to fetch cycle summary");
            }
            return response.json();
        },
        saveLog: async (logData: { user_id: string; log_date: string; is_period_day: boolean; flow_level?: string | null; symptoms?: string[]; mood?: string | null; notes?: string | null }) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/period_tracker.php`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(logData)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to save period log");
            }
            return response.json();
        },
        deleteLog: async (userId: string, logDate: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/period_tracker.php?user_id=${userId}&log_date=${logDate}`), {
                method: "DELETE",
                headers: getHeaders()
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete period log");
            }
            return response.json();
        },
        updateCycleConfig: async (userId: string, config: { cycle_length: number; period_duration: number; last_period_start: string }) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/period_tracker.php`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ action: 'update_cycle_config', user_id: userId, ...config })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update cycle config");
            }
            return response.json();
        }
    },
    notifications: {
        get: async (userId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/notifications.php?user_id=${userId}`), {
                headers: getHeaders()
            });
            if (!response.ok) {
                throw new Error("Failed to fetch notification preferences");
            }
            return response.json();
        },
        save: async (userId: string, preferences: any) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/notifications.php`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ user_id: userId, ...preferences })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to save preferences");
            }
            return response.json();
        },
        registerDevice: async (userId: string, playerId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/notifications.php?action=register_device`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ user_id: userId, player_id: playerId })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to register device");
            }
            return response.json();
        },
        sendTest: async (userId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/notifications.php?action=send_test`), {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ user_id: userId })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to send test notification");
            }
            return response.json();
        },
        unregisterDevice: async (userId: string) => {
            const response = await fetch(getUrl(`${API_BASE_URL}/notifications.php?user_id=${userId}`), {
                method: "DELETE",
                headers: getHeaders()
            });
            return response.json();
        }
    }
};
