import { Sparkles, Download, Gift, ArrowRight, AlertTriangle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import UserSidebar from "@/components/UserSidebar";
import { useAppConfig } from "@/hooks/useAppConfig";

// Modules & Utils
import { useDashboard } from "@/modules/diet/hooks/useDashboard";
import { canUnlockDay, calculateBMI, calculateDailyCalories, getLocalISODate } from "@/lib/utils/diet";
import { downloadMealPlanAsPDF } from "@/lib/utils/pdf-utils";
import { getLogoUrl, getEnableRegenerate, api } from "../lib/api";

// Components
import { MealPlanDisplay } from "@/modules/diet/components/MealPlanDisplay";
import { DailySummary } from "@/modules/diet/components/DailySummary";
import { StatsGrid } from "@/modules/diet/components/StatsGrid";
import { DaySelector } from "@/modules/diet/components/DaySelector";
import { CheckinModal } from "@/modules/user/components/CheckinModal";
import { PeriodCycleWidgetV2 } from "@/modules/period/components/PeriodCycleWidget";
import { usePeriodTracker } from "@/modules/period/hooks/usePeriodTracker";



const Dashboard = () => {
    const appConfig = useAppConfig();
    const navigate = useNavigate();
    const {
        userData, dayPlans, setDayPlans, selectedDay, setSelectedDay, isLoading, isGenerating,
        showCheckinModal, setShowCheckinModal, checkinData, setCheckinData,
        pendingTimer, timeLeft, isTimerExpired, processUnlock,
        unlockTodaysPlan, handleTimerExpiryUnlock, startRegeneration,
        hasActiveSub, activePlanType
    } = useDashboard();

    const [searchParams] = useSearchParams();
    const rawGender = userData?.gender?.toString().toLowerCase().trim();
    const isActuallyFemale = (rawGender === "women" || rawGender === "female") && !(userData as any).is_placeholder;
    const { summary, logs, saveLog } = usePeriodTracker(
        isActuallyFemale ? (userData?.user_id || userData?.id)?.toString() : undefined, 
        isActuallyFemale ? "women" : "male"
    );

    // --- AUTOMATIC PAYMENT VERIFICATION & REFERRAL TRIGGER ---
    useEffect(() => {
        const orderId = searchParams.get("order_id") || searchParams.get("orderId");
        const gateway = searchParams.get("gateway");
        if (!orderId) return;

        // Razorpay verifies inside its checkout handler (already activated subscription).
        // Just clean up pending data and refresh.
        if (gateway === "razorpay") {
            const pendingData = JSON.parse(localStorage.getItem("mrdiet_pending_payment") || "{}");
            const subId = pendingData.subscriptionId;
            if (subId) {
                api.subscriptions.update(subId, { payment_status: 'completed' }).catch(() => { });
            }
            localStorage.removeItem("mrdiet_pending_payment");
            toast.success("Payment successful! Your plan is now active.");
            setTimeout(() => window.location.href = "/dashboard", 1500);
            return;
        }

        const verifyPayment = async () => {
            try {
                // 1. Verify with Cashfree
                const verification = await api.payment.verifyOrder(orderId);
                const status = (verification.order_status || "").toUpperCase();

                if (status === "PAID" || status === "ACTIVE" || status === "COMPLETED") {
                    // 2. Get pending sub ID from localStorage
                    const pendingData = JSON.parse(localStorage.getItem("mrdiet_pending_payment") || "{}");
                    const subId = pendingData.subscriptionId;

                    if (subId) {
                        console.log("[Dashboard] Payment Verified. Activating subscription:", subId);
                        // 3. Update DB -> This triggers referral commission in backend
                        await api.subscriptions.update(subId, { payment_status: 'completed' });

                        // Cleanup
                        localStorage.removeItem("mrdiet_pending_payment");
                        toast.success("Payment successful! Your plan is now active.");

                        // Refresh dashboard logic is handled via useDashboard hook reactivity normally,
                        // but a quick reload ensures everything is perfectly synced.
                        setTimeout(() => window.location.href = "/dashboard", 1500);
                    }
                } else if (status === "FAILED") {
                    toast.error("Payment failed. Please try again.");
                }
            } catch (error) {
                console.error("Payment verification error:", error);
            }
        };

        verifyPayment();
    }, [searchParams]);
    // ---------------------------------------------------------

    // Feature 2: Handle meal substitution — update timeline in local state
    const handleMealSubstituted = (mealIndex: number, newMeal: any, updatedChangesCount: number) => {
        setDayPlans((prev: any[]) => {
            const updated = [...prev];
            const day = { ...updated[selectedDay] };
            if (day.meal_plan?.timeline) {
                const timeline = [...day.meal_plan.timeline];
                // Replace the substituted meal (merge new data into timeline item)
                timeline[mealIndex] = {
                    ...timeline[mealIndex],
                    option_1: newMeal,
                    option_2: undefined,
                    name: newMeal.name,
                    calories: newMeal.calories,
                    protein: newMeal.protein,
                    carbs: newMeal.carbs,
                    fat: newMeal.fat,
                };
                day.meal_plan = { ...day.meal_plan, timeline };
            }
            day.meal_changes_count = 5 - updatedChangesCount;
            updated[selectedDay] = day;
            return updated;
        });
    };

    const currentDayPlan = dayPlans[selectedDay] || null;
    const targetCalories = userData ? calculateDailyCalories(userData) : 2000;
    
    // Fetch settings for logo
    const settings = JSON.parse(window.localStorage.getItem("app_public_settings") || "{}");
    const logoUrl = getLogoUrl(settings.logo_dark || "");

    const handleDownload = () => {
        if (!currentDayPlan?.day_number) return;
        downloadMealPlanAsPDF("printable-meal-plan", currentDayPlan.day_number);
    };

    const handleSignOut = () => {
        localStorage.removeItem("mrdiet_auth_user");
        window.location.href = "/auth";
    };

    // -------- Free Day 1 (dashboard CTA) --------
    const [trialUsed, setTrialUsed] = useState<boolean | null>(null);
    const [startingFreeTrial, setStartingFreeTrial] = useState(false);

    useEffect(() => {
        const userId = (userData as any)?.user_id || (userData as any)?.id;
        if (!userId) return;
        // Decide whether to show the free CTA: only if no past trial subscription exists.
        api.subscriptions.getAllByUserId(String(userId))
            .then((subs: any[]) => {
                const hadTrial = Array.isArray(subs) && subs.some((s) =>
                    String(s?.plan_type || "").toLowerCase() === "trial" ||
                    String(s?.payment_method || "").toLowerCase() === "free"
                );
                setTrialUsed(hadTrial);
            })
            .catch(() => setTrialUsed(false));
    }, [userData]);

    const handleStartFreeDay1Dashboard = async () => {
        const userId = (userData as any)?.user_id || (userData as any)?.id;
        if (!userId) return;
        setStartingFreeTrial(true);
        try {
            const activeSub = await api.subscriptions.getActiveByUserId(String(userId));
            if (activeSub) {
                toast.info("You already have an active plan.");
                window.location.reload();
                return;
            }
            // Auto-create a placeholder profile if user hasn't filled metrics yet —
            // they can complete it later from /health-metrics.
            let profile = await api.profiles.getByUserId(String(userId));
            if (!profile || !profile.id) {
                await api.profiles.create({
                    user_id: userId,
                    name: userData?.name || "User",
                    email: (userData as any)?.email || "",
                    age: 0, gender: "", height: 0, weight: 0,
                    goal: "", activity_level: "",
                    dietary_restrictions: [], allergies: "", meal_preference: "",
                    extended_data: {},
                });
                profile = await api.profiles.getByUserId(String(userId));
            }

            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 1);

            const subscription = await api.subscriptions.create({
                user_id: userId,
                profile_id: profile.id,
                plan_type: "trial",
                plan_days: 1,
                end_date: endDate.toISOString().split("T")[0],
                amount: 0,
                payment_method: "free",
                payment_status: "completed",
            });

            await api.dietPlans.createBatch([{
                subscription_id: subscription.id,
                day_number: 1,
                plan_date: new Date().toISOString().split("T")[0],
                is_unlocked: false,
                user_name: userData?.name || "",
            }]);

            toast.success("Day 1 unlocked — generating your free plan!");
            window.location.reload();
        } catch (e: any) {
            console.error("Free Day 1 error:", e);
            toast.error(e?.message || "Could not start your free Day 1");
            setStartingFreeTrial(false);
        }
    };
    // --------------------------------------------

    const renderRichText = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(\*\*.*?\*\*)/);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <span key={i} className="text-white font-bold">{part.slice(2, -2)}</span>;
            }
            return part;
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-center">
                    <Sparkles className="h-12 w-12 text-[#eab308] animate-pulse mx-auto mb-6" />
                    <h2 className="text-xl font-bold text-white tracking-widest uppercase">Initializing Portal</h2>
                    <Progress value={66} className="w-48 mx-auto mt-6 h-1 bg-white/5" />
                </div>
            </div>
        );
    }

    if (!userData) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-foreground flex overflow-x-hidden">
            {/* Sidebar Component */}
            <UserSidebar logoUrl={logoUrl} gender={userData?.gender} onSignOut={handleSignOut} />

            {/* Main Content Area */}
            <main className="flex-1 min-h-screen overflow-y-auto overflow-x-hidden px-3 sm:px-4 md:px-8 py-6 md:py-8 pt-20 sm:pt-24 lg:pt-8">
                <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                    
                    {(userData as any).is_placeholder && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500 shadow-lg shadow-red-500/5">
                            <div className="flex items-start sm:items-center gap-3">
                                <div className="p-2 sm:p-2.5 bg-red-500/20 rounded-lg flex-shrink-0">
                                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-[13px] sm:text-sm font-bold text-white">Please complete your health metrics to generate your diet plan.</h4>
                                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed mt-1">Your health profile data is required before you can unlock and generate any diet plans.</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => window.location.href='/health-metrics'}
                                className="w-full md:w-auto h-11 md:h-10 px-6 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all shadow-[0_4px_15px_rgba(239,68,68,0.3)] flex-shrink-0"
                            >
                                Complete Health Data
                            </Button>
                        </div>
                    )}

                    
                    {/* Welcome Header Section */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="space-y-2">
                            {hasActiveSub && (
                                <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#1a1608] border border-[#eab308]/20 text-[#eab308] text-[9px] font-semibold tracking-[0.15em] uppercase">
                                    Premium Member
                                </div>
                            )}
                            <h1 className="text-[18px] md:text-3xl font-bold text-white leading-snug">
                                Welcome, <span className="text-[#eab308]">{userData.name || 'Guest'}!</span>
                            </h1>
                            <p className="max-w-sm text-muted-foreground text-xs leading-relaxed">
                                Precision nutrition for your <span className="text-white font-semibold">Health Transform</span> journey.
                            </p>
                        </div>

                        {/* Stats Grid - Inline */}
                        <div className="w-full lg:w-auto">
                            <StatsGrid 
                                targetCalories={targetCalories} 
                                selectedDay={selectedDay} 
                                calculateBMI={() => calculateBMI(userData.height, userData.weight)} 
                                userData={userData} 
                                hasActiveSub={hasActiveSub}
                                activePlanType={activePlanType}
                            />
                        </div>
                    </div>

                    {/* Period Tracker Widget - Gender Restricted */}
                    {isActuallyFemale && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                             <PeriodCycleWidgetV2 
                                summary={summary} 
                                todayLog={logs.find(l => l.log_date === new Date().toISOString().split('T')[0])}
                                onAddLog={() => navigate('/period-tracker')} 
                                onViewFull={() => navigate('/period-tracker')} 
                             />
                        </div>
                    )}

                    {/* Day Selection Area */}
                    {dayPlans.length > 0 ? (
                        <>
                            <div className="space-y-3">
                                <h2 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">Select Day</h2>
                                <DaySelector 
                                    dayPlans={dayPlans} 
                                    selectedDay={selectedDay} 
                                    setSelectedDay={setSelectedDay} 
                                    canUnlockDay={(day, idx) => canUnlockDay(day, idx, dayPlans)} 
                                    getLocalISODate={getLocalISODate} 
                                />
                            </div>

                            {/* Meal Plan Display Section */}
                            <div className="grid lg:grid-cols-3 gap-5">
                                <div className="lg:col-span-2">
                                    <div id="printable-meal-plan" className="bg-transparent space-y-5">
                                        <MealPlanDisplay
                                            currentDayPlan={currentDayPlan}
                                            selectedDay={selectedDay}
                                            dayPlans={dayPlans}
                                            canUnlockDay={(day, idx) => canUnlockDay(day, idx, dayPlans)}
                                            unlockTodaysPlan={unlockTodaysPlan}
                                            isGenerating={isGenerating}
                                            pendingTimer={pendingTimer}
                                            timeLeft={timeLeft}
                                            isTimerExpired={isTimerExpired}
                                            handleTimerExpiryUnlock={handleTimerExpiryUnlock}
                                            userData={userData}
                                            activePlanType={activePlanType}
                                            onMealSubstituted={handleMealSubstituted}
                                        />
                                        {/* Print-only Daily Summary — shown in PDF but hidden on screen */}
                                        {currentDayPlan?.meal_plan && (
                                            <div className="print-only-summary">
                                                <DailySummary
                                                    currentDayPlan={currentDayPlan}
                                                    targetCalories={targetCalories}
                                                    userData={userData}
                                                    periodPhase={isActuallyFemale ? summary?.current_phase : null}
                                                    cycleDay={isActuallyFemale ? summary?.current_cycle_day : null}
                                                    printMode={true}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Sidebar Info */}
                                <div className="space-y-4">
                                    <DailySummary
                                        currentDayPlan={currentDayPlan}
                                        targetCalories={targetCalories}
                                        userData={userData}
                                        periodPhase={isActuallyFemale ? summary?.current_phase : null}
                                        cycleDay={isActuallyFemale ? summary?.current_cycle_day : null}
                                    />

                                    {currentDayPlan?.meal_plan && (
                                        <Button variant="outline" className="w-full h-10 border-white/5 bg-[#0f0f0f] text-[10px] font-semibold hover:bg-white/5 text-gold hover:text-white transition-colors" onClick={handleDownload}>
                                            <Download className="mr-1.5 h-3.5 w-3.5" />
                                            DOWNLOAD PDF
                                        </Button>
                                    )}
                                    
                                    {/* Earnings Referral Card */}
                                    <Card variant="luxury" className="border-l-2 border-l-gold/40 overflow-hidden">
                                        <CardContent className="p-6 space-y-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center border border-gold/20">
                                                    <Gift className="h-4 w-4 text-gold" />
                                                </div>
                                                <h3 className="text-xs md:text-base font-black text-white tracking-tight">Earn Commissions</h3>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {renderRichText(settings.affiliate_text || "Share your transformation with friends and earn upto **₹200 per referral** instantly in your wallet.")}
                                            </p>
                                            <Button 
                                                className="w-full h-11 bg-gold text-black hover:bg-gold/90 border-0 font-black text-[10px] uppercase tracking-[0.1em] rounded-xl shadow-[0_4px_20px_rgba(234,179,8,0.15)] flex items-center justify-center gap-2" 
                                                onClick={() => window.location.href='/partner'}
                                            >
                                                JOIN PARTNER PROGRAM <ArrowRight className="h-3 w-3 shrink-0" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="max-w-4xl mx-auto py-12 text-center">
                            <div className="h-20 w-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="h-10 w-10 text-gold" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-3">
                                {trialUsed ? "Plan Expired/Inactive" : "Choose A Plan"}
                            </h2>
                            <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-10">
                                {trialUsed
                                    ? "Your current nutritional strategy has ended. Choose a new membership tier to continue your health transformation."
                                    : "Want more than Day 1? Upgrade anytime to unlock the full journey."}
                            </p>

                            <div className="grid md:grid-cols-3 gap-4">
                                {[
                                    { id: 'daily', name: 'Daily', price: Number(appConfig.priceDaily) || 99, dur: '1 Day', color: 'from-blue-500/20' },
                                    { id: 'weekly', name: 'Weekly', price: Number(appConfig.priceWeekly) || 599, dur: '7 Days', color: 'from-gold/20' },
                                    { id: 'monthly', name: 'Monthly', price: Number(appConfig.priceMonthly) || 1999, dur: '30 Days', color: 'from-emerald-500/20' }
                                ].map((p) => (
                                    <div key={p.id} className={`bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 text-center group hover:border-gold/30 transition-all cursor-pointer bg-gradient-to-br ${p.color} to-transparent`} onClick={() => window.location.href=`/checkout?plan=${p.id}`}>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold mb-2">{p.name} Plan</p>
                                        <div className="text-2xl font-black text-white mb-1">₹{p.price}</div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{p.dur} Access</p>
                                        <Button variant="luxury" className="w-full mt-6 h-10 text-[10px] opacity-80 group-hover:opacity-100 italic transition-all">{trialUsed ? "RENEW NOW" : "UPGRADE"}</Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {getEnableRegenerate() && (
                <div className="fixed bottom-6 right-6 z-50">
                    <Button 
                        onClick={startRegeneration} 
                        disabled={isGenerating}
                        className="h-12 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-2xl flex items-center gap-2 group"
                    >
                        <Sparkles className="h-4 w-4 group-hover:animate-spin" />
                        <span className="text-[10px] tracking-widest uppercase">Fix AI Plan</span>
                    </Button>
                </div>
            )}

            {showCheckinModal && (
                <CheckinModal
                    checkinData={checkinData}
                    setCheckinData={setCheckinData}
                    processUnlock={processUnlock}
                    langOptions={['English', 'Hindi', 'Hinglish', 'Punjabi', 'Marathi', 'Gujarati']}
                    onClose={() => setShowCheckinModal(false)}
                />
            )}
        </div>
    );
};

export default Dashboard;
