import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { UserData, DayPlan, CheckinData } from "@/lib/types/dashboard";
import { getLocalISODate } from "@/lib/utils/diet";

export const useDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinData, setCheckinData] = useState<CheckinData>({
    language: "English",
    weight: "",
    mood: "Good",
    notes: "",
  });
  const [regenerationMode, setRegenerationMode] = useState(false);


  const [hasActiveSub, setHasActiveSub] = useState(false);
  const [activePlanType, setActivePlanType] = useState<string | null>(null);
  const [pendingTimer, setPendingTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchDashboardData();
    handlePaymentVerification();
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, []);

  const handlePaymentVerification = async () => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");
    if (!orderId) return;

    try {
        const orderData = await api.payment.verifyOrder(orderId);
        if (orderData.order_status === "PAID" || orderData.order_status === "SUCCESS") {
            // Get the pending data from localStorage to find our subscriptionId
            const pendingStr = localStorage.getItem("mrdiet_pending_payment");
            if (pendingStr) {
                const pending = JSON.parse(pendingStr);
                if (pending && pending.subscriptionId) {
                    await api.subscriptions.update(pending.subscriptionId, { payment_status: 'completed' });
                    toast.success("Payment Received! Your plan is being activated.");
                    localStorage.removeItem("mrdiet_pending_payment");
                    fetchDashboardData();
                }
            } else {
                // Fallback: If no localStorage, just refresh to see if backend handled it (webhook) or just try to find new sub
                fetchDashboardData();
            }
            // Clean URL
            navigate("/dashboard", { replace: true });
        } else {
            console.log("Payment not completed yet or failed:", orderData.order_status);
        }
    } catch (e) {
        console.error("Verification error:", e);
    }
  };

  useEffect(() => {
    const currentDay = dayPlans[selectedDay];
    if (currentDay && !currentDay.is_unlocked) {
      checkTimerStatus(currentDay.subscription_id, currentDay.day_number);
    } else {
      setPendingTimer(false);
      setIsTimerExpired(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  }, [selectedDay, dayPlans]);

  const fetchDashboardData = async () => {
    const authUser = localStorage.getItem("mrdiet_auth_user");
    if (!authUser) { navigate("/auth"); return; }

    try {
      const user = JSON.parse(authUser);

      // Parallel fetch: profile & active subscription are independent of each other.
      // Was sequential (~3x slower); now both run together.
      const [profile, sub] = await Promise.all([
        api.profiles.getByUserId(user.id),
        api.subscriptions.getActiveByUserId(user.id),
      ]);

      if (!profile || !profile.height || profile.height == 0) {
        console.log("No complete profile found for user:", user.id, "Providing placeholder...");
        localStorage.removeItem("mrdiet_profile_data"); // Clear stale data
        // Instead of redirecting to get-started, we provide a placeholder
        const placeholderUser: UserData = {
          id: user.id,
          name: user.name || "Guest",
          email: user.email,
          age: 25,
          gender: "unknown", // Changed to unknown to avoid triggering gender-specific logic
          height: 0,
          weight: 0,
          goal: "maintenance",
          activity_level: "moderate",
          plan: "starter",
          is_placeholder: true // Flag to show "Complete Profile" button in UI
        } as any;
        setUserData(placeholderUser);
      } else {
        setUserData(profile);
        localStorage.setItem("mrdiet_profile_data", JSON.stringify(profile));
      }

      setHasActiveSub(!!sub);
      setActivePlanType(sub ? sub.plan_type : null);
      let plans: DayPlan[] = [];

      // dietPlans depends on sub.id, so it has to wait — but only this one call.
      if (sub) {
        plans = await api.dietPlans.getBySubscription(String(sub.id));
      }

      // Construct a fixed 30-day schedule
      const all30Days: DayPlan[] = [];
      const todayStr = getLocalISODate();
      
      for (let i = 1; i <= 30; i++) {
        const existingPlan = plans.find((p: DayPlan) => p.day_number === i);
        if (existingPlan) {
          all30Days.push({
            ...existingPlan,
            is_purchased: true,
            user_name: user.name || 'User'
          } as any);
        } else if (!sub && i === 1) {
            // Day 1 Free Trial if no sub at all
            all30Days.push({
                id: 0,
                subscription_id: 0, 
                day_number: 1,
                plan_date: todayStr,
                is_unlocked: false,
                unlocked_at: null,
                meal_plan: null,
                user_name: user.name || 'User',
                is_purchased: true, // Treat free day as purchased for UI logic
                is_free_trial: true
            } as any);
        } else {
          // Virtual Locked/Not Purchased Day
          all30Days.push({
            id: -i,
            subscription_id: sub ? sub.id : 0,
            day_number: i,
            plan_date: "", 
            is_unlocked: false,
            unlocked_at: null,
            meal_plan: null,
            is_purchased: false,
            user_name: user.name || 'User'
          } as any);
        }
      }

      setDayPlans(all30Days);

      // Select today by default ONLY if no day is currently selected
      if (selectedDay === 0) {
        const todayIdx = all30Days.findIndex((p: DayPlan) => p.plan_date === todayStr);
        if (todayIdx !== -1) setSelectedDay(todayIdx);
      } else {
        // Keep current selectedDay
      }

    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const checkTimerStatus = async (subId: number, day: number) => {
    try {
      const timer = await api.timers.get(String(subId), day);
      if (timer) {
        startCountdown(new Date(timer.unlock_at).getTime());
        setPendingTimer(true);
      } else {
        setPendingTimer(false);
        setIsTimerExpired(false);
      }
    } catch (error) { console.error("Timer check failed", error); }
  };

  const startCountdown = (unlockAt: number) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    
    const update = () => {
      const now = new Date().getTime();
      const distance = unlockAt - now;
      if (distance < 0) {
        setTimeLeft("00:00:00");
        setIsTimerExpired(true);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        return;
      }
      const h = Math.floor(distance / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      setIsTimerExpired(false);
    };

    update();
    timerIntervalRef.current = setInterval(update, 1000);
  };

  // Logic for unlocking a plan
  const unlockTodaysPlan = () => {
    const currentDay = dayPlans[selectedDay];
    if (!currentDay) {
        toast.error("No plan selected");
        return;
    }
    setRegenerationMode(false);
    setShowCheckinModal(true);
  };

  const processUnlock = async (skip: boolean) => {
    setShowCheckinModal(false);

    if (regenerationMode) {
      console.log("[Regen] Entering Regeneration Mode Sequence...");
      await handleRegenerateSequence();
      return;
    }

    setIsGenerating(true);
    const day = dayPlans[selectedDay];

    // Read dynamic timer settings from localStorage
    const settings = JSON.parse(window.localStorage.getItem("app_public_settings") || "{}");
    const timerEnabled = settings.enableGenerationTimer === "1";
    const minHours = parseFloat(settings.timerMinHours || "0.5");
    const maxHours = parseFloat(settings.timerMaxHours || "2");

    // If this is a free trial (subs_id 0), we skip DB and just generate!
    if (day.subscription_id === 0) {
        await handleTimerExpiryUnlock();
        return;
    }

    // TIMER DISABLED — fire check-in (if any) and generate immediately. No artificial delay.
    if (!timerEnabled) {
      try {
        if (!skip) {
          await api.dietPlans.checkIn({
            subscription_id: String(day.subscription_id),
            day_number: day.day_number,
            notes: checkinData.notes,
          }).catch(() => { /* non-fatal */ });
        }
        await handleTimerExpiryUnlock(); // generates + persists + refetches
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // TIMER ENABLED — show countdown, generate in background, unlock when timer expires.
    const randomHours = Math.random() * (maxHours - minHours) + minHours;
    const unlockAt = new Date().getTime() + (randomHours * 60 * 60 * 1000);

    try {
      await api.timers.create(String(day.subscription_id), day.day_number, unlockAt);
      if (!skip) await api.dietPlans.checkIn({
        subscription_id: String(day.subscription_id),
        day_number: day.day_number,
        notes: checkinData.notes
      });

      startCountdown(unlockAt);
      setPendingTimer(true);
      toast.success("Our expert team is now preparing your plan!");

      // Fire-and-forget background generation
      console.log(`[Diet API] 🚀 Background Generation Started for Day ${day.day_number}...`);
      api.dietPlans.generate(userData, day.day_number, userData?.plan || 'starter', checkinData.language, checkinData.notes, day.subscription_id).then(data => {
         const plan = data.mealPlan || data.meal_plan;
         if (plan) {
             window.sessionStorage.setItem(`generated_plan_${day.day_number}`, JSON.stringify(plan));
             console.log(`[Diet API] ✅ Background Generation Complete! Pre-cached for instant viewing.`);
         }
      }).catch(err => console.error("[Diet API] ❌ Background Generation Error:", err));

    } catch (e) {
      toast.error("Process failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTimerExpiryUnlock = async () => {
    setIsGenerating(true);
    const day = dayPlans[selectedDay];
    try {
      let generatedPlan = null;

      // Check if plan was already generated in the background
      const cachedStr = window.sessionStorage.getItem(`generated_plan_${day.day_number}`);
      if (cachedStr) {
          console.log(`[Diet API] ⚡ Loading pre-generated plan from background cache!`);
          generatedPlan = JSON.parse(cachedStr);
          window.sessionStorage.removeItem(`generated_plan_${day.day_number}`);
      } else {
          console.log(`[Diet API] 🚀 No cache found. Live generating plan for Day ${day.day_number}...`);
          const data = await api.dietPlans.generate(userData, day.day_number, userData?.plan || 'starter', checkinData.language, checkinData.notes, day.subscription_id);
          console.log(`[Diet API] ✅ Live Response Received!`, data);
          generatedPlan = data.mealPlan || data.meal_plan;
      }

      if (generatedPlan) {
        // VIRTUAL Free Day 1 (subscription_id === 0) → create a real trial sub + day_plan,
        // THEN persist the generated plan to it. Otherwise the next page-visit
        // would re-fetch with no DB record and the unlock button would show again.
        if (day.subscription_id === 0) {
            const authUser = JSON.parse(localStorage.getItem("mrdiet_auth_user") || "{}");
            let profile = await api.profiles.getByUserId(authUser.id);
            // Auto-create placeholder profile if none exists yet
            if (!profile || !profile.id) {
                await api.profiles.create({
                    user_id: authUser.id,
                    name: authUser.name || "User",
                    email: authUser.email || "",
                    age: 0, gender: "", height: 0, weight: 0,
                    goal: "", activity_level: "",
                    dietary_restrictions: [], allergies: "", meal_preference: "",
                    extended_data: {},
                });
                profile = await api.profiles.getByUserId(authUser.id);
            }
            if (!profile) throw new Error("Profile not found");

            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 1);
            const subscription = await api.subscriptions.create({
                user_id: authUser.id,
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
                user_name: authUser.name || profile.name,
            }]);
            console.log(`[Diet API] 💾 Trial subscription #${subscription.id} created for Free Day 1.`);
            await api.dietPlans.unlock(String(subscription.id), 1, generatedPlan);
            toast.success("Welcome! Here is your Free Day 1 plan.");
            await fetchDashboardData();
        } else {
            console.log(`[Diet API] 💾 Unlocking and Saving Plan in Database...`);
            await api.dietPlans.unlock(String(day.subscription_id), day.day_number, generatedPlan);
            await api.timers.delete(String(day.subscription_id), day.day_number);
            toast.success("Day " + day.day_number + " plan is ready!");
            await fetchDashboardData();
        }
        console.log(`[Diet API] 🎉 Dashboard Updated!`);
      } else {
         console.warn(`[Diet API] ⚠️ Background or Live sequence completed, but no plan could be found or extracted.`);
      }
    } catch (err: any) {
      console.error(`[Diet API] ❌ Backend or OpenAI Generation Error:`, err.message || err);
      toast.error("Generation failed: " + (err.message || "Server Error"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateSequence = async () => {
    setIsGenerating(true);
    const day = dayPlans[selectedDay];
    console.log("[Regen] Sequence started for Day:", day?.day_number);
    try {
      if (!day) throw new Error("Day selection invalid");
      if (!userData) throw new Error("User data missing");

      console.log(`[Regen] 🚀 API GENERATE CALLED for Day ${day.day_number}! Params:`, {
        plan: userData?.plan,
        lang: checkinData.language,
        notes: checkinData.notes
      });
      const data = await api.dietPlans.generate(userData, day.day_number, userData?.plan || 'starter', checkinData.language, checkinData.notes, day.subscription_id);
      console.log("[Regen] API Response:", data);
      
      const generatedPlan = data.mealPlan || data.meal_plan;
      
      if (generatedPlan) {
        if (day.subscription_id === 0) {
            console.log("[Regen] Saving Free Plan...");
            const updated = [...dayPlans];
            updated[selectedDay] = { ...day, is_unlocked: true, meal_plan: generatedPlan };
            setDayPlans(updated);
            toast.success("Regenerated Free Plan!");
        } else {
            console.log("[Regen] Saving to DB...");
            await api.dietPlans.unlock(String(day.subscription_id), day.day_number, generatedPlan);
            toast.success("Regenerated with your new preferences!");
            await fetchDashboardData();
        }
      } else {
          toast.error("AI could not generate a plan. Please try again.");
      }
    } catch (e: any) { 
        console.error("[Regen] Error:", e);
        toast.error("Regen failed: " + (e.message || "Unknown error")); 
    } finally { 
        setIsGenerating(false);
        setRegenerationMode(false);
    }
  };

  const startRegeneration = async () => {
    const day = dayPlans[selectedDay];
    console.log("[Regen] Start clicked for day:", selectedDay, "Plan:", day);
    if (!day || !day.is_unlocked) {
        toast.error("You can only fix/regenerate an already unlocked plan.");
        console.warn("[Regen] Blocked: Plan not unlocked or invalid.");
        return;
    }
    setRegenerationMode(true);
    setCheckinData(prev => ({ ...prev, notes: "" })); // Clear previous notes for a fresh fix
    setShowCheckinModal(true);
    console.log(`[Regen] 🛡️ Sequence initiated for Day ${day.day_number} | Mode: ${day.subscription_id === 0 ? "Trial" : "Subscription"}`);
  };


  return {
    userData, dayPlans, setDayPlans, selectedDay, setSelectedDay, isLoading, isGenerating,
    showCheckinModal, setShowCheckinModal, checkinData, setCheckinData,
    pendingTimer, timeLeft, isTimerExpired, processUnlock,
    unlockTodaysPlan, handleTimerExpiryUnlock, startRegeneration, fetchDashboardData,
    hasActiveSub, activePlanType
  };
};
