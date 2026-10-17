import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Save, ArrowLeft, Activity, Check, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { api, getEnableDummyData } from "@/lib/api";
import { load } from "@cashfreepayments/cashfree-js";
import UserSidebar from "@/components/UserSidebar";
import { getLogoUrl } from "@/lib/api";

type FormData = {
    name: string;
    email: string;
    phone: string;
    age: string;
    gender: string;
    heightFt: string;
    heightIn: string;
    weight: string;
    city: string;
    occupation: string;
    workingHours: string;
    maritalStatus: string;
    children: string;
    livingSituation: string;
    hormonalGoals: string[];
    primaryFitnessGoals: string[];
    targetTimeline: string;
    expectedWeight: string;
    motivationLevel: string;
    lifestyleMetabolic: string[];
    digestiveHealth: string[];
    hormonalMaleSpecific: string[];
    hormonalFemaleSpecific: string[];
    otherConditions: string[];
    menstrualRegularity: string;
    averageCycleLength: string;
    periodDuration: string;
    menstrualFlow: string;
    periodSymptoms: string[];
    pcos: string;
    pregnancyStatus: string;
    currentSupplements: string[];
    pastSurgeries: string;
    digestiveHealthOverall: string;
    alcoholConsumption: string;
    smokingHabit: string;
    wakeUpTime: string;
    sleepTime: string;
    sleepDuration: string;
    sleepQuality: string;
    dailyMovementLevel: string;
    stressLevel: string;
    waterIntake: string;
    currentlyExercise: string;
    exerciseTypes: string[];
    exerciseFrequency: string;
    dietType: string[];
    foodsDislike: string;
    foodAllergies: string[];
    foodAllergiesOther: string;
    teaCoffeeIntake: string;
    outsideFood: string;
    spiceTolerance: string;
    breakfastTime: string;
    midMorningSnackTime: string;
    lunchTime: string;
    eveningSnackTime: string;
    dinnerTime: string;
    lateNightEating: string;
    whoCooksMeals: string;
    kitchenAppliances: string[];
    budgetForFood: string;
    specialInstructions: string;
};

const emptyFormData: FormData = {
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    heightFt: "",
    heightIn: "",
    weight: "",
    city: "",
    occupation: "",
    workingHours: "",
    maritalStatus: "",
    children: "",
    livingSituation: "",
    hormonalGoals: [],
    primaryFitnessGoals: [],
    targetTimeline: "",
    expectedWeight: "",
    motivationLevel: "",
    lifestyleMetabolic: [],
    digestiveHealth: [],
    hormonalMaleSpecific: [],
    hormonalFemaleSpecific: [],
    otherConditions: [],
    menstrualRegularity: "",
    averageCycleLength: "",
    periodDuration: "",
    menstrualFlow: "",
    periodSymptoms: [],
    pcos: "",
    pregnancyStatus: "",
    currentSupplements: [],
    pastSurgeries: "",
    digestiveHealthOverall: "",
    alcoholConsumption: "",
    smokingHabit: "",
    wakeUpTime: "",
    sleepTime: "",
    sleepDuration: "",
    sleepQuality: "",
    dailyMovementLevel: "",
    stressLevel: "",
    waterIntake: "",
    currentlyExercise: "",
    exerciseTypes: [],
    exerciseFrequency: "",
    dietType: [],
    foodsDislike: "",
    foodAllergies: [],
    foodAllergiesOther: "",
    teaCoffeeIntake: "",
    outsideFood: "",
    spiceTolerance: "",
    breakfastTime: "",
    midMorningSnackTime: "",
    lunchTime: "",
    eveningSnackTime: "",
    dinnerTime: "",
    lateNightEating: "",
    whoCooksMeals: "",
    kitchenAppliances: [],
    budgetForFood: "",
    specialInstructions: "",
};

const HealthMetrics = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [formData, setFormData] = useState<FormData>(emptyFormData);
    const [activeSection, setActiveSection] = useState<string>("basic");
    const [isNewUser, setIsNewUser] = useState(false);
    const [showFreeDay1, setShowFreeDay1] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const settings = JSON.parse(window.localStorage.getItem("app_public_settings") || "{}");
    const logoUrl = getLogoUrl(settings.logo_dark || "");

    useEffect(() => {
        const authUser = localStorage.getItem("mrdiet_auth_user");
        if (!authUser) {
            navigate("/auth" + window.location.search);
            return;
        }
        const user = JSON.parse(authUser);
        setCurrentUser(user);
        loadProfile(user.id);
    }, [navigate]);

    const loadProfile = async (userId: string) => {
        try {
            const profile = await api.profiles.getByUserId(userId);
            if (profile) {
                if (!profile.height || profile.height == 0) {
                    setIsNewUser(true);
                } else {
                    setIsNewUser(false);
                }
                let ed = profile.extended_data || {};
                // If nested formData exists (happens sometimes with GetStarted saves), flatten it
                if (ed.formData) {
                    ed = { ...ed, ...ed.formData };
                }
                const heightCm = parseFloat(profile.height) || 0;
                const heightTotalIn = heightCm / 2.54;
                const ft = Math.floor(heightTotalIn / 12);
                const inches = Math.round(heightTotalIn % 12);

                setFormData({
                    name: profile.name || ed.name || "",
                    email: profile.email || ed.email || "",
                    phone: ed.phone || "",
                    age: ed.age ? String(ed.age) : (profile.age ? String(profile.age) : ""),
                    gender: ed.gender || profile.gender || "",
                    heightFt: ed.heightFt || (ft ? String(ft) : ""),
                    heightIn: ed.heightIn || (inches ? String(inches) : ""),
                    weight: ed.weight ? String(ed.weight) : (profile.weight ? String(profile.weight) : ""),
                    city: ed.city || "",
                    occupation: ed.occupation || "",
                    workingHours: ed.workingHours || "",
                    maritalStatus: ed.maritalStatus || "",
                    children: ed.children || "",
                    livingSituation: ed.livingSituation || "",
                    hormonalGoals: ed.hormonalGoals || [],
                    primaryFitnessGoals: ed.primaryFitnessGoals || [],
                    targetTimeline: ed.targetTimeline || "",
                    expectedWeight: ed.expectedWeight || "",
                    motivationLevel: ed.motivationLevel || "",
                    lifestyleMetabolic: ed.lifestyleMetabolic || [],
                    digestiveHealth: ed.digestiveHealth || [],
                    hormonalMaleSpecific: ed.hormonalMaleSpecific || [],
                    hormonalFemaleSpecific: ed.hormonalFemaleSpecific || [],
                    otherConditions: ed.otherConditions || [],
                    menstrualRegularity: ed.menstrualRegularity || "",
                    averageCycleLength: ed.averageCycleLength || "",
                    periodDuration: ed.periodDuration || "",
                    menstrualFlow: ed.menstrualFlow || "",
                    periodSymptoms: ed.periodSymptoms || [],
                    pcos: ed.pcos || "",
                    pregnancyStatus: ed.pregnancyStatus || "",
                    currentSupplements: ed.currentSupplements || [],
                    pastSurgeries: ed.pastSurgeries || "",
                    digestiveHealthOverall: ed.digestiveHealthOverall || "",
                    alcoholConsumption: ed.alcoholConsumption || "",
                    smokingHabit: ed.smokingHabit || "",
                    wakeUpTime: ed.wakeUpTime || "",
                    sleepTime: ed.sleepTime || "",
                    sleepDuration: ed.sleepDuration || "",
                    sleepQuality: ed.sleepQuality || "",
                    dailyMovementLevel: ed.dailyMovementLevel || "",
                    stressLevel: ed.stressLevel || "",
                    waterIntake: ed.waterIntake || "",
                    currentlyExercise: ed.currentlyExercise || "",
                    exerciseTypes: ed.exerciseTypes || [],
                    exerciseFrequency: ed.exerciseFrequency || "",
                    dietType: ed.dietType || [],
                    foodsDislike: ed.foodsDislike || "",
                    foodAllergies: ed.foodAllergies || [],
                    foodAllergiesOther: ed.foodAllergiesOther || "",
                    teaCoffeeIntake: ed.teaCoffeeIntake || "",
                    outsideFood: ed.outsideFood || "",
                    spiceTolerance: ed.spiceTolerance || "",
                    breakfastTime: ed.breakfastTime || "",
                    midMorningSnackTime: ed.midMorningSnackTime || "",
                    lunchTime: ed.lunchTime || "",
                    eveningSnackTime: ed.eveningSnackTime || "",
                    dinnerTime: ed.dinnerTime || "",
                    lateNightEating: ed.lateNightEating || "",
                    whoCooksMeals: ed.whoCooksMeals || "",
                    kitchenAppliances: ed.kitchenAppliances || [],
                    budgetForFood: ed.budgetForFood || "",
                    specialInstructions: ed.specialInstructions || "",
                });
            }
        } catch (err) {
            console.error("Failed to load profile:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof FormData, value: string | string[]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleArrayToggle = (field: keyof FormData, value: string) => {
        setFormData((prev) => {
            const currentArray = prev[field] as string[];
            const newArray = currentArray.includes(value)
                ? currentArray.filter((item) => item !== value)
                : [...currentArray, value];
            return { ...prev, [field]: newArray };
        });
    };

    const handleSave = async () => {
        if (!currentUser?.id) return;
        if (!formData.name || !formData.age || !formData.heightFt || !formData.heightIn || !formData.weight || !formData.phone) {
            toast.error("Please fill in at least: Name, Phone, Age, Height, and Weight");
            return;
        }

        setIsSaving(true);
        try {
            await api.profiles.create({
                name: formData.name,
                email: formData.email,
                user_id: currentUser.id,
                age: parseInt(formData.age),
                gender: formData.gender,
                height: (parseFloat(formData.heightFt) * 30.48) + (parseFloat(formData.heightIn) * 2.54),
                weight: parseFloat(formData.weight),
                goal: formData.primaryFitnessGoals.join(", "),
                activity_level: formData.dailyMovementLevel,
                dietary_restrictions: [...formData.lifestyleMetabolic, ...formData.digestiveHealth, ...formData.hormonalMaleSpecific, ...formData.hormonalFemaleSpecific, ...formData.otherConditions],
                allergies: [...formData.foodAllergies, formData.foodAllergiesOther].filter(Boolean).join(", "),
                meal_preference: `${formData.dietType.join(", ")}, ${formData.foodsDislike}`,
                extended_data: formData,
            });
            
            // Fetch the updated profile to ensure localStorage is in sync
            const updatedProfile = await api.profiles.getByUserId(currentUser.id);
            if (updatedProfile) {
                localStorage.setItem("mrdiet_profile_data", JSON.stringify(updatedProfile));
            }

            toast.success("Health metrics saved successfully!");
            if (isNewUser) {
                setShowFreeDay1(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to save health metrics");
        } finally {
            setIsSaving(false);
        }
    };

    const handleStartFreeDay1 = async () => {
        if (!currentUser?.id) {
            toast.error("Please login first");
            return;
        }
        setIsProcessing(true);
        try {
            // If user already has an active subscription (trial or paid), just send them to dashboard.
            const activeSub = await api.subscriptions.getActiveByUserId(currentUser.id);
            if (activeSub) {
                toast.info("You already have an active plan. Redirecting...");
                window.location.href = "/dashboard";
                return;
            }

            const profile = await api.profiles.getByUserId(currentUser.id);
            if (!profile) throw new Error("Profile not found. Please save your data first.");

            // Free 1-day trial subscription
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 1);

            const subscription = await api.subscriptions.create({
                user_id: currentUser.id,
                profile_id: profile.id,
                plan_type: "trial",
                plan_days: 1,
                end_date: endDate.toISOString().split("T")[0],
                amount: 0,
                payment_method: "free",
                payment_status: "completed",
            });

            // Create the single day_plan entry
            await api.dietPlans.createBatch([{
                subscription_id: subscription.id,
                day_number: 1,
                plan_date: new Date().toISOString().split("T")[0],
                is_unlocked: false,
                user_name: currentUser.name || formData.name,
            }]);

            toast.success("Day 1 unlocked — let's generate your free plan!");
            window.location.href = "/dashboard";
        } catch (error: any) {
            console.error("Free trial error:", error);
            toast.error(error.message || "Could not start your free Day 1");
            setIsProcessing(false);
        }
    };

    const loadRazorpayScript = () =>
        new Promise<boolean>((resolve) => {
            if ((window as any).Razorpay) return resolve(true);
            const s = document.createElement("script");
            s.src = "https://checkout.razorpay.com/v1/checkout.js";
            s.onload = () => resolve(true);
            s.onerror = () => resolve(false);
            document.body.appendChild(s);
        });

    const handleInitiatePayment = async (planKey: string) => {
        if (!currentUser?.id) {
            toast.error("Please login first");
            return;
        }

        const planMap: any = {
            daily: { key: "daily", days: 1, price: Number(settings.priceDaily) || 99 },
            weekly: { key: "weekly", days: 7, price: Number(settings.priceWeekly) || 599 },
            monthly: { key: "monthly", days: 30, price: Number(settings.priceMonthly) || 1999 },
        };

        const plan = planMap[planKey];
        const cfg = JSON.parse(window.localStorage.getItem("app_public_settings") || "{}");
        const useRazorpay = cfg.enable_razorpay === "1";
        const gateway: "razorpay" | "cashfree" = useRazorpay ? "razorpay" : "cashfree";

        setIsProcessing(true);

        try {
            // Block duplicate active subscription
            const activeSub = await api.subscriptions.getActiveByUserId(currentUser.id);
            if (activeSub) {
                toast.error(`You already have an active ${activeSub.plan_type} plan until ${activeSub.end_date}.`);
                setIsProcessing(false);
                return;
            }

            const profile = await api.profiles.getByUserId(currentUser.id);
            if (!profile) throw new Error("Profile not found. Please save your profile first.");

            const endDate = new Date();
            endDate.setDate(endDate.getDate() + plan.days);

            const subscription = await api.subscriptions.create({
                user_id: currentUser.id,
                profile_id: profile.id,
                plan_type: plan.key,
                plan_days: plan.days,
                end_date: endDate.toISOString().split("T")[0],
                amount: plan.price,
                payment_method: gateway,
                payment_status: "pending",
            });

            const dayPlanEntries = [];
            for (let i = 1; i <= plan.days; i++) {
                const pd = new Date();
                pd.setDate(pd.getDate() + i - 1);
                dayPlanEntries.push({
                    subscription_id: subscription.id,
                    day_number: i,
                    plan_date: pd.toISOString().split("T")[0],
                    is_unlocked: false,
                    user_name: currentUser.name || formData.name,
                });
            }
            await api.dietPlans.createBatch(dayPlanEntries);

            localStorage.setItem("mrdiet_pending_payment", JSON.stringify({
                formData,
                selectedPlan: planKey,
                currentUser,
                profileId: profile.id,
                subscriptionId: subscription.id,
                gateway,
            }));

            const phone = formData.phone || profile.extended_data?.phone || "9999999999";
            const orderData = await api.payment.createOrder(plan.price, { ...currentUser, phone }, gateway);

            // ---------------- RAZORPAY ----------------
            if (gateway === "razorpay") {
                if (!orderData?.order_id || !orderData?.key_id) {
                    throw new Error(orderData?.error || "Razorpay order failed");
                }
                const ok = await loadRazorpayScript();
                if (!ok) throw new Error("Could not load Razorpay checkout");

                const rzp = new (window as any).Razorpay({
                    key: orderData.key_id,
                    order_id: orderData.order_id,
                    amount: orderData.amount,
                    currency: orderData.currency || "INR",
                    name: cfg.brand_name || "MRDiet",
                    description: `${plan.key} Plan`,
                    prefill: orderData.prefill || {
                        name: currentUser?.name,
                        email: currentUser?.email,
                        contact: phone,
                    },
                    theme: { color: "#d4af37" },
                    handler: async (response: any) => {
                        try {
                            const verify = await api.payment.verifyRazorpay({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            });
                            if (verify.order_status === "PAID") {
                                toast.success("Payment successful!");
                                window.location.href = `/dashboard?order_id=${response.razorpay_order_id}&gateway=razorpay`;
                            } else {
                                toast.error("Payment verification failed");
                                setIsProcessing(false);
                            }
                        } catch (e: any) {
                            toast.error(e?.message || "Verification error");
                            setIsProcessing(false);
                        }
                    },
                    modal: {
                        ondismiss: () => {
                            toast.info("Payment cancelled");
                            setIsProcessing(false);
                        }
                    }
                });
                rzp.on("payment.failed", (resp: any) => {
                    toast.error(resp?.error?.description || "Payment failed");
                    setIsProcessing(false);
                });
                rzp.open();
                return;
            }

            // ---------------- CASHFREE ----------------
            const cashfree = await load({ mode: (orderData.cf_mode || "production") as any });
            if (orderData.payment_session_id) {
                toast.info("Redirecting to Secure Payment...");
                cashfree.checkout({
                    paymentSessionId: orderData.payment_session_id,
                    redirectTarget: "_self"
                });
            } else {
                throw new Error("Failed to initiate payment gateway");
            }
        } catch (error: any) {
            console.error("Payment Error:", error);
            toast.error(error.message || "Payment initiation failed");
            setIsProcessing(false);
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem("mrdiet_auth_user");
        window.location.href = "/auth";
    };

    const handleNextSection = () => {
        const currentIndex = sections.findIndex(s => s.id === activeSection);
        
        // Validation
        if (activeSection === "basic") {
            if (!formData.gender || !formData.name || !formData.age || !formData.heightFt || !formData.heightIn || !formData.weight || !formData.phone) {
                toast.error("Please fill in all basic information (Gender, Name, Phone, Age, Height, Weight).");
                return;
            }
        } else if (activeSection === "goals") {
            if (formData.primaryFitnessGoals.length === 0 || !formData.targetTimeline || !formData.expectedWeight) {
                toast.error("Please select your fitness goals, target timeline, and expected weight.");
                return;
            }
        } else if (activeSection === "food") {
            if (formData.dietType.length === 0) {
                toast.error("Please select your Diet Type.");
                return;
            }
        }

        if (currentIndex < sections.length - 1) {
            setActiveSection(sections[currentIndex + 1].id);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            handleSave();
        }
    };


    const selectedGender = formData.gender;

    const sections = [
        { id: "basic", label: "Basic Info" },
        { id: "goals", label: "Goals" },
        { id: "medical", label: "Medical" },
        { id: "lifestyle", label: "Lifestyle" },
        { id: "food", label: "Food & Meals" },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-center">
                    <Sparkles className="h-12 w-12 text-[#eab308] animate-pulse mx-auto mb-6" />
                    <h2 className="text-xl font-bold text-white tracking-widest uppercase">Loading Health Metrics</h2>
                    <Progress value={66} className="w-48 mx-auto mt-6 h-1 bg-white/5" />
                </div>
            </div>
        );
    }

    if (showFreeDay1) {
        return (
            <div className="min-h-screen bg-[#000000] text-foreground flex flex-col items-center justify-center p-4 md:p-6 font-sans">
                <div className="max-w-lg w-full">
                    <Card variant="luxury" data-aos="fade-up">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-4">
                                <Sparkles className="h-8 w-8 text-gold" />
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 mx-auto mb-3">
                                <span className="text-[10px] font-black gold-text uppercase tracking-[0.2em]">Step 1 Complete</span>
                            </div>
                            <CardTitle className="text-2xl md:text-3xl">Your Profile Is Ready</CardTitle>
                            <p className="text-sm text-muted-foreground mt-2">
                                We've saved your health metrics. Now generate your <span className="text-gold font-bold">Day 1 plan — completely FREE</span>.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent p-5 space-y-3">
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-white">AI-personalized Day 1 menu</p>
                                        <p className="text-[11px] text-muted-foreground">Built around your goals, allergies & lifestyle.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-white">No payment required</p>
                                        <p className="text-[11px] text-muted-foreground">Try the experience before committing.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Check className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-white">Unlock more days anytime</p>
                                        <p className="text-[11px] text-muted-foreground">Upgrade later from your dashboard.</p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="luxury"
                                className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-gold/20"
                                onClick={handleStartFreeDay1}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    "Activating..."
                                ) : (
                                    <>
                                        Generate My Day 1 Plan — Free
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>

                            <div className="text-center">
                                <Button
                                    variant="link"
                                    className="text-gray-500 hover:text-gold uppercase tracking-[0.3em] text-[10px] font-black"
                                    onClick={() => navigate("/dashboard")}
                                >
                                    Skip for now
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }




    return (
        <div className="min-h-screen bg-[#050505] text-foreground flex">
            <UserSidebar logoUrl={logoUrl} gender={formData.gender} onSignOut={handleSignOut} />

            <main className="flex-1 min-h-screen overflow-y-auto overflow-x-hidden px-3 sm:px-4 md:px-8 py-6 md:py-8 pt-20 sm:pt-24 lg:pt-8 pb-20">
                <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                    {/* Header */}
                    <div className="space-y-2">
                        <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#1a1608] border border-[#eab308]/20 text-[#eab308] text-[9px] font-semibold tracking-[0.15em] uppercase">
                            Health Profile
                        </div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-snug flex items-center gap-2 sm:gap-3">
                            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-[#eab308] flex-shrink-0" />
                            <span>Health <span className="text-[#eab308]">Metrics</span></span>
                        </h1>
                        <p className="max-w-sm text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
                            Complete your health profile for personalized AI diet plans. All fields are editable at any time.
                        </p>
                    </div>

                    {/* Section Navigation or Wizard Header */}
                    {isNewUser ? (
                        <div className="max-w-xl mx-auto mb-8 w-full">
                            <div className="flex items-center justify-between">
                                {sections.map((s, index) => {
                                    const step = index + 1;
                                    const currentStep = sections.findIndex(sec => sec.id === activeSection) + 1;
                                    return (
                                        <div key={s.id} className="flex items-center flex-1 last:flex-none">
                                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-xs shrink-0 transition-colors ${currentStep >= step ? "bg-[#eab308] text-black" : "bg-[#1a1a1a] border border-white/10 text-muted-foreground"}`}>
                                                {currentStep > step ? "✓" : step}
                                            </div>
                                            {index < sections.length - 1 && (
                                                <div className={`h-0.5 sm:h-1 w-full mx-1 sm:mx-2 rounded transition-colors ${currentStep > step ? "bg-[#eab308]" : "bg-[#1a1a1a]"}`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Active label only on mobile (saves horizontal space); all labels on sm+ */}
                            <div className="mt-3 sm:hidden text-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#eab308]">
                                    Step {sections.findIndex(s => s.id === activeSection) + 1} / {sections.length}
                                    {' · '}
                                    {sections.find(s => s.id === activeSection)?.label}
                                </span>
                            </div>
                            <div className="hidden sm:flex justify-between mt-3 text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                {sections.map((s) => (
                                    <span key={s.id} className={s.id === activeSection ? "text-[#eab308]" : ""}>{s.label}</span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar sm:flex-wrap">
                            {sections.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveSection(s.id)}
                                    className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                        activeSection === s.id
                                            ? "bg-gold/10 text-gold border border-gold/20"
                                            : "bg-[#0f0f0f] text-muted-foreground border border-white/5 hover:text-white hover:border-white/10"
                                    }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    )}


                    {/* Form Sections */}
                    <Card className="bg-[#0a0a0a] border border-white/5 rounded-2xl">
                        {/* Section: Basic Info */}
                        {activeSection === "basic" && (
                            <CardContent className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-6">Gender</h3>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div
                                            className={`flex-1 p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 flex items-center gap-4 ${
                                                selectedGender === "men"
                                                    ? "border-blue-500 bg-blue-50/5"
                                                    : "border-white/10 hover:border-blue-300/30 bg-[#0f0f0f]"
                                            }`}
                                            onClick={() => handleInputChange("gender", "men")}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedGender === "men" ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-muted-foreground"}`}>
                                                <span className="text-lg font-bold">M</span>
                                            </div>
                                            <span className={`font-bold ${selectedGender === "men" ? "text-blue-400" : "text-foreground"}`}>Men</span>
                                        </div>
                                        <div
                                            className={`flex-1 p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 flex items-center gap-4 ${
                                                selectedGender === "women"
                                                    ? "border-pink-500 bg-pink-50/5"
                                                    : "border-white/10 hover:border-pink-300/30 bg-[#0f0f0f]"
                                            }`}
                                            onClick={() => handleInputChange("gender", "women")}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedGender === "women" ? "bg-pink-500/20 text-pink-400" : "bg-white/5 text-muted-foreground"}`}>
                                                <span className="text-lg font-bold">W</span>
                                            </div>
                                            <span className={`font-bold ${selectedGender === "women" ? "text-pink-400" : "text-foreground"}`}>Women</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-white">Personal Information</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="hm-name">Full Name *</Label>
                                        <Input id="hm-name" placeholder="Enter your full name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hm-email">Email Address</Label>
                                        <Input id="hm-email" type="email" placeholder="Enter your email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="hm-phone">WhatsApp Number *</Label>
                                            <Input id="hm-phone" type="tel" placeholder="+91 XXXXX XXXXX" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hm-age">Age *</Label>
                                            <Input id="hm-age" type="number" placeholder="Enter your age" value={formData.age} onChange={(e) => handleInputChange("age", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="hm-heightFt">Height (Feet) *</Label>
                                            <Input id="hm-heightFt" placeholder="e.g., 5" type="number" value={formData.heightFt} onChange={(e) => handleInputChange("heightFt", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hm-heightIn">Height (Inches) *</Label>
                                            <Input id="hm-heightIn" placeholder="e.g., 8" type="number" value={formData.heightIn} onChange={(e) => handleInputChange("heightIn", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hm-weight">Weight (kg) *</Label>
                                            <Input id="hm-weight" type="number" placeholder="e.g., 70" value={formData.weight} onChange={(e) => handleInputChange("weight", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hm-city">City</Label>
                                        <Input id="hm-city" placeholder="Enter your city" value={formData.city} onChange={(e) => handleInputChange("city", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Occupation</Label>
                                        <RadioGroup value={formData.occupation} onValueChange={(value) => handleInputChange("occupation", value)} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {(selectedGender === "women"
                                                ? ["Student", "Desk Job", "Business", "Field / Outdoor Job", "Physical Job", "Night-Shift Job", "Homemaker", "None"]
                                                : ["Student", "Desk Job", "Business", "Field / Outdoor Job", "Physical Job", "Night-Shift Job", "None"]
                                            ).map((option) => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`occ-${option}`} />
                                                    <Label htmlFor={`occ-${option}`}>{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="hm-workingHours">Working Hours (per day)</Label>
                                        <Input id="hm-workingHours" type="number" placeholder="e.g. 8" value={formData.workingHours} onChange={(e) => handleInputChange("workingHours", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Marital Status</Label>
                                            <RadioGroup value={formData.maritalStatus} onValueChange={(value) => handleInputChange("maritalStatus", value)} className="grid gap-2">
                                                {["Single", "Married", "Recently Married", selectedGender === "women" ? "Divorced / Separated" : "Planning", selectedGender === "women" ? "Planning marriage" : ""].filter(Boolean).map(opt => (
                                                    <div key={opt} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={opt} id={`ms-${opt}`} />
                                                        <Label htmlFor={`ms-${opt}`}>{opt}</Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Children</Label>
                                            <RadioGroup value={formData.children} onValueChange={(value) => handleInputChange("children", value)} className="grid gap-2">
                                                {["No children", "1 child", "2 children", "3+ children", selectedGender === "women" ? "Planning pregnancy" : "Planning"].map(opt => (
                                                    <div key={opt} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={opt} id={`ch-${opt}`} />
                                                        <Label htmlFor={`ch-${opt}`}>{opt}</Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Living Situation</Label>
                                        <RadioGroup value={formData.livingSituation} onValueChange={(value) => handleInputChange("livingSituation", value)} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {["With family", "With partner", "Living alone", "With roommates", "Hostel / PG"].map(opt => (
                                                <div key={opt} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={opt} id={`ls-${opt}`} />
                                                    <Label htmlFor={`ls-${opt}`}>{opt}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>
                            </CardContent>
                        )}

                        {/* Section: Goals */}
                        {activeSection === "goals" && (
                            <CardContent className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white">{selectedGender === "men" ? "Hormonal Goals" : "Female Health Goals"}</h3>
                                    <p className="text-xs text-muted-foreground">Select all that apply</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(selectedGender === "men"
                                            ? ["Thyroid management", "Diabetes / Prediabetes control", "Cholesterol management", "BP control", "Fatty liver improvement", "Reduce acidity / bloating", "Improve gut health", "Hormone balance", "Testosterone support", "Correct Vitamin D", "B12 deficiency", "None"]
                                            : ["Hormonal balance", "Regular menstrual cycle", "Reduce PMS symptoms", "PCOS / PCOD management", "Thyroid management", "Diabetes / Prediabetes control", "Cholesterol management", "BP control", "Fatty liver improvement", "Reduce bloating / acidity", "Improve gut health", "Improve fertility", "Pregnancy nutrition support", "Post-pregnancy recovery", "Lactation support", "Improve skin & hair health", "Correct Vitamin D deficiency", "Correct Vitamin B12 deficiency", "Iron deficiency correction", "None"]
                                        ).map((goal) => (
                                            <div key={goal} className="flex items-center space-x-2">
                                                <Checkbox id={`hg-${goal}`} checked={formData.hormonalGoals.includes(goal)} onCheckedChange={() => handleArrayToggle("hormonalGoals", goal)} />
                                                <Label htmlFor={`hg-${goal}`}>{goal}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-white">Primary Fitness Goal</h3>
                                    <p className="text-xs text-muted-foreground">Select all that apply</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(selectedGender === "men"
                                            ? ["Weight Loss", "Weight Gain", "Fat Loss", "Muscle Gain", "Lean Muscle Toning", "Strength Building", "Body Recomposition", "Increase Energy", "Improve Stamina"]
                                            : ["Weight Loss", "Weight Gain", "Fat Loss", "Muscle Toning", "Lean Muscle Development", "Strength Building", "Body Recomposition", "Increase Energy", "Improve Stamina", "Improve Metabolism"]
                                        ).map((goal) => (
                                            <div key={goal} className="flex items-center space-x-2">
                                                <Checkbox id={`fg-${goal}`} checked={formData.primaryFitnessGoals.includes(goal)} onCheckedChange={() => handleArrayToggle("primaryFitnessGoals", goal)} />
                                                <Label htmlFor={`fg-${goal}`}>{goal}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Target Timeline</Label>
                                            <RadioGroup value={formData.targetTimeline} onValueChange={(value) => handleInputChange("targetTimeline", value)} className="grid gap-2">
                                                {["30 days", "45 days", "60 days (2 months)", "90 days (3 months)", "No fixed timeline"].map((option) => (
                                                    <div key={option} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={option} id={`tt-${option}`} />
                                                        <Label htmlFor={`tt-${option}`}>{option}</Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hm-expectedWeight">Expected Weight (kg)</Label>
                                            <Input id="hm-expectedWeight" type="number" placeholder="e.g., 65" value={formData.expectedWeight} onChange={(e) => handleInputChange("expectedWeight", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Motivation Level (1-10)</Label>
                                            <RadioGroup value={formData.motivationLevel} onValueChange={(value) => handleInputChange("motivationLevel", value)} className="grid grid-cols-5 gap-2">
                                                {Array.from({ length: 10 }, (_, i) => (i + 1).toString()).map((level) => (
                                                    <div key={level} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={level} id={`ml-${level}`} />
                                                        <Label htmlFor={`ml-${level}`}>{level}</Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        )}

                        {/* Section: Medical */}
                        {activeSection === "medical" && (
                            <CardContent className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
                                {/* Menstrual Health for Women */}
                                {selectedGender === "women" && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white">Menstrual & Reproductive Health</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Menstrual Cycle Regularity</Label>
                                                <RadioGroup value={formData.menstrualRegularity} onValueChange={(value) => handleInputChange("menstrualRegularity", value)} className="grid gap-2">
                                                    {["Regular", "Irregular", "Very irregular", "Missed periods", "Not applicable (pregnant / menopause)"].map((option) => (
                                                        <div key={option} className="flex items-center space-x-2">
                                                            <RadioGroupItem value={option} id={`mr-${option}`} />
                                                            <Label htmlFor={`mr-${option}`}>{option}</Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Average Cycle Length</Label>
                                                <RadioGroup value={formData.averageCycleLength} onValueChange={(value) => handleInputChange("averageCycleLength", value)} className="grid gap-2">
                                                    {["21–24 days", "25–28 days", "29–32 days", "Varies every month", "Not sure"].map((option) => (
                                                        <div key={option} className="flex items-center space-x-2">
                                                            <RadioGroupItem value={option} id={`cl-${option}`} />
                                                            <Label htmlFor={`cl-${option}`}>{option}</Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label>Period Duration</Label>
                                                <RadioGroup value={formData.periodDuration} onValueChange={(value) => handleInputChange("periodDuration", value)} className="grid gap-2">
                                                    {["2–3 days", "4–5 days", "6–7 days", "More than 7 days"].map((option) => (
                                                        <div key={option} className="flex items-center space-x-2">
                                                            <RadioGroupItem value={option} id={`pd-${option}`} />
                                                            <Label htmlFor={`pd-${option}`}>{option}</Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Menstrual Flow</Label>
                                                <RadioGroup value={formData.menstrualFlow} onValueChange={(value) => handleInputChange("menstrualFlow", value)} className="grid gap-2">
                                                    {["Light", "Moderate", "Heavy", "Very heavy"].map((option) => (
                                                        <div key={option} className="flex items-center space-x-2">
                                                            <RadioGroupItem value={option} id={`mf-${option}`} />
                                                            <Label htmlFor={`mf-${option}`}>{option}</Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>PCOS / PCOD</Label>
                                                <RadioGroup value={formData.pcos} onValueChange={(value) => handleInputChange("pcos", value)} className="grid gap-2">
                                                    {["Diagnosed", "Suspected", "No"].map((option) => (
                                                        <div key={option} className="flex items-center space-x-2">
                                                            <RadioGroupItem value={option} id={`pcos-${option}`} />
                                                            <Label htmlFor={`pcos-${option}`}>{option}</Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Period Symptoms (Select all that apply)</Label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {["Severe cramps", "Mild cramps", "Back pain", "Headaches / migraine", "Mood swings", "Fatigue", "Bloating", "Breast tenderness", "Acne breakouts", "None"].map((symptom) => (
                                                    <div key={symptom} className="flex items-center space-x-2">
                                                        <Checkbox id={`ps-${symptom}`} checked={formData.periodSymptoms.includes(symptom)} onCheckedChange={() => handleArrayToggle("periodSymptoms", symptom)} />
                                                        <Label htmlFor={`ps-${symptom}`}>{symptom}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Pregnancy Status</Label>
                                            <RadioGroup value={formData.pregnancyStatus} onValueChange={(value) => handleInputChange("pregnancyStatus", value)} className="grid gap-2">
                                                {["Not pregnant", "Pregnant", "Postpartum (within 1 year)", "Breastfeeding", "Menopause"].map((option) => (
                                                    <div key={option} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={option} id={`preg-${option}`} />
                                                        <Label htmlFor={`preg-${option}`}>{option}</Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                    </div>
                                )}

                                {/* Medical Conditions */}
                                <div className="border-t border-white/5 pt-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-white">Lifestyle & Metabolic</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {["Obesity / Overweight", "Diabetes (Type 1 / Type 2)", "Prediabetes", "Insulin resistance", "High cholesterol", "High BP", "Fatty liver", "Anemia (low iron)", "None"].map((condition) => (
                                            <div key={condition} className="flex items-center space-x-2">
                                                <Checkbox id={`lm-${condition}`} checked={formData.lifestyleMetabolic.includes(condition)} onCheckedChange={() => handleArrayToggle("lifestyleMetabolic", condition)} />
                                                <Label htmlFor={`lm-${condition}`}>{condition}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-white">Digestive Health</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {["Acidity / GERD", "Gas / Bloating", "IBS", "Constipation", "Diarrhea", "None"].map((condition) => (
                                            <div key={condition} className="flex items-center space-x-2">
                                                <Checkbox id={`dh-${condition}`} checked={formData.digestiveHealth.includes(condition)} onCheckedChange={() => handleArrayToggle("digestiveHealth", condition)} />
                                                <Label htmlFor={`dh-${condition}`}>{condition}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-white">{selectedGender === "men" ? "Hormonal & Male-Specific" : "Hormonal & Female-Specific"}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(selectedGender === "men"
                                            ? ["Low testosterone", "Erectile dysfunction", "Low libido", "Thyroid issues (Hypo / Hyper)", "None"]
                                            : ["Thyroid issues (Hypo / Hyper)", "PCOS / PCOD", "Hormonal imbalance", "Low energy / fatigue", "Hair fall", "Irregular periods", "None"]
                                        ).map((condition) => (
                                            <div key={condition} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`hs-${condition}`}
                                                    checked={(selectedGender === "men" ? formData.hormonalMaleSpecific : formData.hormonalFemaleSpecific).includes(condition)}
                                                    onCheckedChange={() => handleArrayToggle(selectedGender === "men" ? "hormonalMaleSpecific" : "hormonalFemaleSpecific", condition)}
                                                />
                                                <Label htmlFor={`hs-${condition}`}>{condition}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-white">Other Conditions</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {["Migraines", "Asthma", "Anxiety", "Stress", "Depression", "Joint pain", "Kidney issues", "None"].map((condition) => (
                                            <div key={condition} className="flex items-center space-x-2">
                                                <Checkbox id={`oc-${condition}`} checked={formData.otherConditions.includes(condition)} onCheckedChange={() => handleArrayToggle("otherConditions", condition)} />
                                                <Label htmlFor={`oc-${condition}`}>{condition}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Supplements & History */}
                                <div className="border-t border-white/5 pt-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-white">Current Supplements</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(selectedGender === "men"
                                            ? ["Multivitamin", "Omega-3", "Vitamin D", "Vitamin B12", "Protein powder", "Creatine", "Pre-workout", "Biotin", "Joint support", "None"]
                                            : ["Multivitamin", "Omega-3", "Vitamin D", "Vitamin B12", "Iron supplement", "Calcium", "Protein powder", "Biotin", "Probiotics", "Prenatal vitamins", "None"]
                                        ).map((supplement) => (
                                            <div key={supplement} className="flex items-center space-x-2">
                                                <Checkbox id={`sup-${supplement}`} checked={formData.currentSupplements.includes(supplement)} onCheckedChange={() => handleArrayToggle("currentSupplements", supplement)} />
                                                <Label htmlFor={`sup-${supplement}`}>{supplement}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="hm-pastSurgeries">{selectedGender === "men" ? "Past Surgeries" : "Past Surgeries / Deliveries"}</Label>
                                        <Textarea id="hm-pastSurgeries" placeholder="Write details (max 600 characters)" value={formData.pastSurgeries} onChange={(e) => handleInputChange("pastSurgeries", e.target.value)} className="min-h-[80px] bg-[#0f0f0f] border-white/10" maxLength={600} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Digestive Health (Overall)</Label>
                                        <RadioGroup value={formData.digestiveHealthOverall} onValueChange={(value) => handleInputChange("digestiveHealthOverall", value)} className="grid gap-2">
                                            {["Very good", "Moderate", "Poor", "Changes frequently"].map((option) => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`dho-${option}`} />
                                                    <Label htmlFor={`dho-${option}`}>{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>
                            </CardContent>
                        )}

                        {/* Section: Lifestyle */}
                        {activeSection === "lifestyle" && (
                            <CardContent className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white">Lifestyle Habits</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Alcohol Consumption</Label>
                                            <RadioGroup value={formData.alcoholConsumption} onValueChange={(value) => handleInputChange("alcoholConsumption", value)} className="grid gap-2">
                                                {["Never", "Occasionally", "Every weekend", "1–2 drinks/week", "3–4 drinks/week", "Daily drinking"].map((option) => (
                                                    <div key={option} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={option} id={`alc-${option}`} />
                                                        <Label htmlFor={`alc-${option}`}>{option}</Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Smoking Habit</Label>
                                            <RadioGroup value={formData.smokingHabit} onValueChange={(value) => handleInputChange("smokingHabit", value)} className="grid gap-2">
                                                {["No", "Yes, occasionally", "Regular", "Heavy smoker", "Quit recently"].map((option) => (
                                                    <div key={option} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={option} id={`smk-${option}`} />
                                                        <Label htmlFor={`smk-${option}`}>{option}</Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-white">Daily Routine</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="hm-wakeUpTime">Wake-Up Time</Label>
                                            <Input id="hm-wakeUpTime" type="time" value={formData.wakeUpTime} onChange={(e) => handleInputChange("wakeUpTime", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hm-sleepTime">Sleep Time</Label>
                                            <Input id="hm-sleepTime" type="time" value={formData.sleepTime} onChange={(e) => handleInputChange("sleepTime", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="hm-sleepDuration">Sleep Duration (hours)</Label>
                                            <Input id="hm-sleepDuration" placeholder="e.g., 7" value={formData.sleepDuration} onChange={(e) => handleInputChange("sleepDuration", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Sleep Quality</Label>
                                            <RadioGroup value={formData.sleepQuality} onValueChange={(value) => handleInputChange("sleepQuality", value)} className="grid gap-2">
                                                {["Excellent", "Good", "Average", "Poor", "Very disturbed"].map((option) => (
                                                    <div key={option} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={option} id={`sq-${option}`} />
                                                        <Label htmlFor={`sq-${option}`}>{option}</Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Daily Movement Level</Label>
                                            <RadioGroup value={formData.dailyMovementLevel} onValueChange={(value) => handleInputChange("dailyMovementLevel", value)} className="grid gap-2">
                                                {["Very low", "Low", "Moderate", "High", "Very high"].map((option) => (
                                                    <div key={option} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={option} id={`dml-${option}`} />
                                                        <Label htmlFor={`dml-${option}`}>{option}</Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Stress Level</Label>
                                            <RadioGroup value={formData.stressLevel} onValueChange={(value) => handleInputChange("stressLevel", value)} className="grid gap-2">
                                                {["Very low", "Low", "Moderate", "High", "Very high"].map((option) => (
                                                    <div key={option} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={option} id={`str-${option}`} />
                                                        <Label htmlFor={`str-${option}`}>{option}</Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Water Intake</Label>
                                            <RadioGroup value={formData.waterIntake} onValueChange={(value) => handleInputChange("waterIntake", value)} className="grid gap-2">
                                                {["Less than 1 litre", "1–1.5 litres", "1.5–2 litres", "2–3 litres", "More than 3 litres", "No idea"].map((option) => (
                                                    <div key={option} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={option} id={`wi-${option}`} />
                                                        <Label htmlFor={`wi-${option}`}>{option}</Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-white">Physical Activity</h3>
                                    <div className="space-y-2">
                                        <Label>Do You Currently Exercise?</Label>
                                        <RadioGroup value={formData.currentlyExercise} onValueChange={(value) => handleInputChange("currentlyExercise", value)} className="flex gap-4">
                                            {["Yes", "No", "Sometimes"].map((option) => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`ce-${option}`} />
                                                    <Label htmlFor={`ce-${option}`}>{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Type of Exercise You Do (Select all that apply)</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {(selectedGender === "men"
                                                ? ["Gym", "Home", "Bodyweight training", "Cardio", "Yoga", "None"]
                                                : ["Gym", "Home workouts", "Yoga", "Pilates", "Cardio", "Strength training", "Walking", "None"]
                                            ).map((type) => (
                                                <div key={type} className="flex items-center space-x-2">
                                                    <Checkbox id={`et-${type}`} checked={formData.exerciseTypes.includes(type)} onCheckedChange={() => handleArrayToggle("exerciseTypes", type)} />
                                                    <Label htmlFor={`et-${type}`}>{type}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Exercise Frequency</Label>
                                        <RadioGroup value={formData.exerciseFrequency} onValueChange={(value) => handleInputChange("exerciseFrequency", value)} className="grid gap-2">
                                            {["0 days", "1–2 days", "3 days", "4 days", "5 days", "6 days", "Daily"].map((option) => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`ef-${option}`} />
                                                    <Label htmlFor={`ef-${option}`}>{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>
                            </CardContent>
                        )}

                        {/* Section: Food & Meals */}
                        {activeSection === "food" && (
                            <CardContent className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white">Food Preferences</h3>
                                    <div className="space-y-2">
                                        <Label>Diet Type (Select all that apply)</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {["Vegetarian", "Non-Vegetarian", "Eggetarian", "Vegan", "Jain"].map((option) => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <Checkbox id={`dt-${option}`} checked={formData.dietType.includes(option)} onCheckedChange={() => handleArrayToggle("dietType", option)} />
                                                    <Label htmlFor={`dt-${option}`}>{option}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hm-foodsDislike">Foods You Dislike</Label>
                                        <Textarea id="hm-foodsDislike" placeholder="Write here (max 600 characters)" value={formData.foodsDislike} onChange={(e) => handleInputChange("foodsDislike", e.target.value)} className="min-h-[80px] bg-[#0f0f0f] border-white/10" maxLength={600} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Food Allergies (Select all that apply)</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {["Dairy allergy", "Lactose intolerance", "Gluten intolerance", "Peanut allergy", "Soy allergy", "Egg allergy", "Seafood allergy", "None"].map((allergy) => (
                                                <div key={allergy} className="flex items-center space-x-2">
                                                    <Checkbox id={`fa-${allergy}`} checked={formData.foodAllergies.includes(allergy)} onCheckedChange={() => handleArrayToggle("foodAllergies", allergy)} />
                                                    <Label htmlFor={`fa-${allergy}`}>{allergy}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hm-foodAllergiesOther">Food Allergies (Other)</Label>
                                        <Textarea id="hm-foodAllergiesOther" placeholder="Write here (max 600 characters)" value={formData.foodAllergiesOther} onChange={(e) => handleInputChange("foodAllergiesOther", e.target.value)} className="min-h-[80px] bg-[#0f0f0f] border-white/10" maxLength={600} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="hm-teaCoffeeIntake">Tea & Coffee Intake</Label>
                                            <Input id="hm-teaCoffeeIntake" placeholder="e.g., 2 cups/day" value={formData.teaCoffeeIntake} onChange={(e) => handleInputChange("teaCoffeeIntake", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Outside Food</Label>
                                            <RadioGroup value={formData.outsideFood} onValueChange={(value) => handleInputChange("outsideFood", value)} className="grid gap-2">
                                                {["Rarely (0–1 times/week)", "1–2 times/week", "3–4 times/week", "Almost daily", "None"].map((option) => (
                                                    <div key={option} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={option} id={`of-${option}`} />
                                                        <Label htmlFor={`of-${option}`}>{option}</Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Spice Tolerance</Label>
                                        <RadioGroup value={formData.spiceTolerance} onValueChange={(value) => handleInputChange("spiceTolerance", value)} className="flex gap-4">
                                            {["Low", "Medium", "High (very spicy food)", "None"].map((option) => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`sp-${option}`} />
                                                    <Label htmlFor={`sp-${option}`}>{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-white">Meal Timings</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="hm-breakfastTime">Breakfast Time</Label>
                                            <Input id="hm-breakfastTime" type="time" value={formData.breakfastTime} onChange={(e) => handleInputChange("breakfastTime", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hm-midMorningSnackTime">Mid-Morning Snack Time</Label>
                                            <Input id="hm-midMorningSnackTime" type="time" value={formData.midMorningSnackTime} onChange={(e) => handleInputChange("midMorningSnackTime", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hm-lunchTime">Lunch Time</Label>
                                            <Input id="hm-lunchTime" type="time" value={formData.lunchTime} onChange={(e) => handleInputChange("lunchTime", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hm-eveningSnackTime">Evening Snack Time</Label>
                                            <Input id="hm-eveningSnackTime" type="time" value={formData.eveningSnackTime} onChange={(e) => handleInputChange("eveningSnackTime", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hm-dinnerTime">Dinner Time</Label>
                                            <Input id="hm-dinnerTime" type="time" value={formData.dinnerTime} onChange={(e) => handleInputChange("dinnerTime", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hm-lateNightEating">Late-Night Eating</Label>
                                        <Input id="hm-lateNightEating" placeholder="Yes / No – mention time if yes" value={formData.lateNightEating} onChange={(e) => handleInputChange("lateNightEating", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-white">Household Setup</h3>
                                    <div className="space-y-2">
                                        <Label>Who Cooks Your Daily Meals?</Label>
                                        <RadioGroup value={formData.whoCooksMeals} onValueChange={(value) => handleInputChange("whoCooksMeals", value)} className="grid gap-2">
                                            {["I cook myself", "Mother / Family member", "Cook / House-help", "Mostly eat outside", "Tiffin service", "Hostel / PG food"].map((option) => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`wc-${option}`} />
                                                    <Label htmlFor={`wc-${option}`}>{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kitchen Appliances Available (Select all that apply)</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {["Gas stove", "Microwave", "Air Fryer", "Mixer / Blender"].map((appliance) => (
                                                <div key={appliance} className="flex items-center space-x-2">
                                                    <Checkbox id={`ka-${appliance}`} checked={formData.kitchenAppliances.includes(appliance)} onCheckedChange={() => handleArrayToggle("kitchenAppliances", appliance)} />
                                                    <Label htmlFor={`ka-${appliance}`}>{appliance}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Budget for Food</Label>
                                        <RadioGroup value={formData.budgetForFood} onValueChange={(value) => handleInputChange("budgetForFood", value)} className="grid gap-2">
                                            {["Low", "Medium", "Comfortable", "High", "Premium", "Not sure / varies"].map((option) => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`bf-${option}`} />
                                                    <Label htmlFor={`bf-${option}`}>{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="hm-specialInstructions">Special Instructions</Label>
                                        <Textarea
                                            id="hm-specialInstructions"
                                            placeholder={`Write any personal preferences or limitations${selectedGender === "women" ? ", pregnancy notes, religious or cultural food restrictions" : ""} (max 600 characters)`}
                                            value={formData.specialInstructions}
                                            onChange={(e) => handleInputChange("specialInstructions", e.target.value)}
                                            className="min-h-[100px] bg-[#0f0f0f] border-white/10"
                                            maxLength={600}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex flex-col-reverse md:flex-row gap-6 mt-16">
                        {isNewUser ? (
                            <>
                                <Button variant="outline" className="flex-1 h-auto py-4 md:h-11 md:py-0 border-white/10 hover:bg-white/5 font-bold text-[12px] md:text-[10px] uppercase tracking-widest rounded-xl" onClick={() => {
                                    const currentIndex = sections.findIndex(s => s.id === activeSection);
                                    if (currentIndex > 0) setActiveSection(sections[currentIndex - 1].id);
                                    else navigate("/dashboard");
                                }}>
                                    <ArrowLeft className="mr-2 h-5 w-5 md:h-4 md:w-4" /> Back
                                </Button>
                                <Button
                                    variant="luxury"
                                    className="flex-1 h-auto py-4 md:h-11 md:py-0 font-black text-[12px] md:text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-gold/20 rounded-xl"
                                    onClick={handleNextSection}
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Saving..." : (sections.findIndex(s => s.id === activeSection) === sections.length - 1 ? "Submit Profile" : "Next")}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="outline" className="flex-1 h-auto py-4 md:h-11 md:py-0 border-white/10 hover:bg-white/5 font-bold text-[12px] md:text-[10px] uppercase tracking-widest rounded-xl" onClick={() => navigate("/dashboard")}>
                                    <ArrowLeft className="mr-2 h-5 w-5 md:h-4 md:w-4" /> Back to Dashboard
                                </Button>
                                <Button
                                    variant="luxury"
                                    className="flex-1 h-auto py-4 md:h-11 md:py-0 font-black text-[12px] md:text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-gold/20 rounded-xl"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        "Saving..."
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-5 w-5 md:h-4 md:w-4" /> Update {sections.find(s => s.id === activeSection)?.label} Data
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HealthMetrics;
