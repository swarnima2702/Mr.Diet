import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, ArrowLeft, Lock, Tag, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { api, getLogoUrl } from "@/lib/api";
import UserSidebar from "@/components/UserSidebar";
import { load } from "@cashfreepayments/cashfree-js";

type PlanKey = "daily" | "weekly" | "monthly";

const Checkout = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const planParam = (searchParams.get("plan") || "weekly") as PlanKey;

    const settings = JSON.parse(window.localStorage.getItem("app_public_settings") || "{}");
    const logoUrl = getLogoUrl(settings.logo_dark || "");

    const planMap: Record<PlanKey, { name: string; price: number; original: number; days: number }> = {
        daily: { name: "Daily", price: Number(settings.priceDaily) || 99, original: Number(settings.originalPriceDaily) || 199, days: 1 },
        weekly: { name: "Weekly", price: Number(settings.priceWeekly) || 599, original: Number(settings.originalPriceWeekly) || 1399, days: 7 },
        monthly: { name: "Monthly", price: Number(settings.priceMonthly) || 1999, original: Number(settings.originalPriceMonthly) || 5999, days: 30 },
    };
    const plan = planMap[planParam] || planMap.weekly;

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [couponCode, setCouponCode] = useState("");
    const [applying, setApplying] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
    const [couponMessage, setCouponMessage] = useState<string>("");
    const [paying, setPaying] = useState(false);
    const [preview, setPreview] = useState<any | null>(null); // upgrade/renew/downgrade preview
    const [previewLoading, setPreviewLoading] = useState(true);

    const credit = Number(preview?.credit) || 0;
    const subtotal = plan.price;
    const finalAmount = Math.max(0, Math.round((subtotal - credit - discount) * 100) / 100);
    const isBlocked = preview?.mode === "downgrade";

    useEffect(() => {
        const stored = localStorage.getItem("mrdiet_auth_user");
        if (!stored) {
            navigate("/auth?plan=" + planParam);
            return;
        }
        const u = JSON.parse(stored);
        setUser(u);
        // Profile is optional for checkout — user can pay first, fill metrics later from dashboard.
        // We just load whatever exists (might have null id if never filled).
        api.profiles.getByUserId(u.id).then((p) => {
            setProfile(p || null);
        }).catch(() => setProfile(null));
        api.subscriptions.previewChange(String(u.id), planParam)
            .then((res) => setPreview(res))
            .catch(() => setPreview({ mode: "new", final_amount: plan.price, credit: 0 }))
            .finally(() => setPreviewLoading(false));
        // eslint-disable-next-line
    }, []);

    const applyCoupon = async () => {
        if (!couponCode.trim()) return;
        setApplying(true);
        setCouponMessage("");
        try {
            const r = await api.coupons.validate(couponCode.trim().toUpperCase(), planParam, plan.price);
            if (r.valid) {
                setDiscount(Number(r.discount_amount) || 0);
                setAppliedCoupon(r.code);
                setCouponMessage(r.message || "Coupon applied!");
                toast.success("Coupon applied — ₹" + (Number(r.discount_amount) || 0) + " off");
            } else {
                setDiscount(0);
                setAppliedCoupon(null);
                setCouponMessage(r.message || "Invalid coupon");
                toast.error(r.message || "Invalid coupon");
            }
        } catch (e: any) {
            setCouponMessage("Could not validate coupon");
            toast.error("Could not validate coupon");
        } finally {
            setApplying(false);
        }
    };

    const removeCoupon = () => {
        setDiscount(0);
        setAppliedCoupon(null);
        setCouponCode("");
        setCouponMessage("");
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

    const handlePay = async () => {
        if (!user?.id) return;
        if (isBlocked) {
            toast.error(preview?.message || "Plan change not allowed");
            return;
        }
        setPaying(true);
        try {
            // Ensure a profile row exists. If user hasn't filled health metrics yet,
            // create a minimal placeholder so subscription.profile_id is valid.
            // User can complete metrics from /dashboard → /health-metrics later.
            let activeProfile = profile;
            if (!activeProfile || !activeProfile.id) {
                const created = await api.profiles.create({
                    user_id: user.id,
                    name: user.name || "User",
                    email: user.email || "",
                    age: 0,
                    gender: "",
                    height: 0,
                    weight: 0,
                    goal: "",
                    activity_level: "",
                    dietary_restrictions: [],
                    allergies: "",
                    meal_preference: "",
                    extended_data: {},
                });
                // Re-fetch to get the row id
                activeProfile = await api.profiles.getByUserId(user.id);
                if (!activeProfile?.id && created?.id) activeProfile = { ...activeProfile, id: created.id };
                setProfile(activeProfile);
            }
            const cfg = JSON.parse(window.localStorage.getItem("app_public_settings") || "{}");
            const useRazorpay = cfg.enable_razorpay === "1";
            const gateway: "razorpay" | "cashfree" = useRazorpay ? "razorpay" : "cashfree";

            // For RENEW: extend from current end_date. For UPGRADE/NEW: from today.
            let startBase = new Date();
            if (preview?.mode === "renew" && preview?.current_end) {
                const currentEnd = new Date(preview.current_end);
                if (currentEnd > startBase) startBase = currentEnd;
            }
            const endDate = new Date(startBase);
            endDate.setDate(endDate.getDate() + plan.days);

            const replacesId = preview?.mode === "upgrade" ? preview?.current_sub_id : null;

            const subscription = await api.subscriptions.create({
                user_id: user.id,
                profile_id: activeProfile.id,
                plan_type: planParam,
                plan_days: plan.days,
                end_date: endDate.toISOString().split("T")[0],
                amount: finalAmount,
                payment_method: gateway,
                payment_status: finalAmount === 0 ? "completed" : "pending",
                replaces_subscription_id: replacesId,
            });

            const dayPlanEntries: any[] = [];
            for (let i = 1; i <= plan.days; i++) {
                const pd = new Date();
                pd.setDate(pd.getDate() + i - 1);
                dayPlanEntries.push({
                    subscription_id: subscription.id,
                    day_number: i,
                    plan_date: pd.toISOString().split("T")[0],
                    is_unlocked: false,
                    user_name: user.name || activeProfile.name,
                });
            }
            await api.dietPlans.createBatch(dayPlanEntries);

            // FREE checkout (₹0 due — credit + coupon covered everything)
            if (finalAmount === 0) {
                toast.success("Plan activated — no payment needed!");
                window.location.href = "/dashboard";
                return;
            }

            localStorage.setItem("mrdiet_pending_payment", JSON.stringify({
                selectedPlan: planParam,
                currentUser: user,
                profileId: activeProfile.id,
                subscriptionId: subscription.id,
                gateway,
                couponCode: appliedCoupon,
                discount,
            }));

            const phone = activeProfile.extended_data?.phone || "9999999999";
            const orderData = await api.payment.createOrder(
                finalAmount,
                { ...user, phone },
                gateway,
                { coupon_code: appliedCoupon || "", plan_type: planParam }
            );

            if (gateway === "razorpay") {
                if (!orderData?.order_id || !orderData?.key_id) {
                    throw new Error(orderData?.error || "Razorpay order failed");
                }
                const ok = await loadRazorpayScript();
                if (!ok) throw new Error("Could not load Razorpay");

                const rzp = new (window as any).Razorpay({
                    key: orderData.key_id,
                    order_id: orderData.order_id,
                    amount: orderData.amount,
                    currency: orderData.currency || "INR",
                    name: cfg.brand_name || "MRDiet",
                    description: `${plan.name} Plan`,
                    prefill: orderData.prefill || { name: user?.name, email: user?.email, contact: phone },
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
                                setPaying(false);
                            }
                        } catch (e: any) {
                            toast.error(e?.message || "Verification error");
                            setPaying(false);
                        }
                    },
                    modal: {
                        ondismiss: () => {
                            toast.info("Payment cancelled");
                            setPaying(false);
                        }
                    }
                });
                rzp.on("payment.failed", (resp: any) => {
                    toast.error(resp?.error?.description || "Payment failed");
                    setPaying(false);
                });
                rzp.open();
                return;
            }

            // Cashfree — use mode returned by backend (auto-detects TEST keys → sandbox)
            const cashfree = await load({ mode: (orderData.cf_mode || "production") as any });
            if (orderData.payment_session_id) {
                toast.info("Redirecting to Secure Payment...");
                cashfree.checkout({ paymentSessionId: orderData.payment_session_id, redirectTarget: "_self" });
            } else {
                throw new Error("Failed to initiate payment gateway");
            }
        } catch (e: any) {
            console.error("Checkout error:", e);
            toast.error(e?.message || "Payment initiation failed");
            setPaying(false);
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem("mrdiet_auth_user");
        window.location.href = "/auth";
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-center">
                    <Sparkles className="h-12 w-12 text-gold animate-pulse mx-auto mb-6" />
                    <p className="text-sm text-muted-foreground tracking-widest uppercase">Loading checkout…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-foreground flex">
            <UserSidebar logoUrl={logoUrl} onSignOut={handleSignOut} />
            <main className="flex-1 min-h-screen overflow-y-auto overflow-x-hidden px-3 sm:px-4 md:px-8 py-6 md:py-10 pt-20 sm:pt-24 lg:pt-10">
                <div className="max-w-2xl mx-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/pricing")}
                        className="mb-4 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to plans
                    </Button>

                    <Card variant="luxury">
                        <CardHeader>
                            <CardTitle className="text-2xl">Checkout</CardTitle>
                            <p className="text-xs text-muted-foreground">Review your order and apply a coupon if you have one.</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Plan summary */}
                            <div className="rounded-xl border border-gold/20 bg-gold/5 p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold mb-1">{plan.name} Plan</p>
                                    <p className="text-xs text-muted-foreground">{plan.days} day{plan.days > 1 ? "s" : ""} access</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-muted-foreground line-through mr-2">₹{plan.original}</span>
                                    <span className="text-2xl font-black text-white">₹{plan.price}</span>
                                </div>
                            </div>

                            {/* Upgrade / renew / downgrade banner */}
                            {!previewLoading && preview && preview.mode !== "new" && (
                                <div className={`rounded-xl border p-4 text-xs leading-relaxed ${preview.mode === "upgrade"
                                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                                    : preview.mode === "renew"
                                        ? "border-blue-500/30 bg-blue-500/5 text-blue-300"
                                        : "border-red-500/30 bg-red-500/5 text-red-300"}`}>
                                    <p className="font-bold uppercase text-[10px] tracking-[0.2em] mb-1">
                                        {preview.mode === "upgrade" ? "Upgrade" : preview.mode === "renew" ? "Renewal" : "Not allowed"}
                                    </p>
                                    <p>{preview.message}</p>
                                </div>
                            )}

                            {/* Coupon */}
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest opacity-60 flex items-center gap-2">
                                    <Tag className="h-3 w-3" /> Coupon code
                                </Label>
                                {appliedCoupon ? (
                                    <div className="flex items-center justify-between p-3 rounded-xl border border-green-500/30 bg-green-500/5">
                                        <div className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-500" />
                                            <div>
                                                <p className="text-sm font-bold text-white tracking-wider">{appliedCoupon}</p>
                                                <p className="text-[10px] text-green-400">{couponMessage}</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost" className="text-xs h-8" onClick={removeCoupon}>Remove</Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter coupon"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            className="bg-background/50 border-border/50 font-bold tracking-wider uppercase"
                                            disabled={applying}
                                        />
                                        <Button onClick={applyCoupon} disabled={applying || !couponCode.trim()} variant="luxuryOutline" className="h-10 px-5 font-bold text-xs uppercase tracking-widest">
                                            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                                        </Button>
                                    </div>
                                )}
                                {couponMessage && !appliedCoupon && (
                                    <p className="text-[10px] text-red-400">{couponMessage}</p>
                                )}
                            </div>

                            {/* Totals */}
                            <div className="bg-secondary/30 rounded-xl p-5 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>₹{subtotal}</span>
                                </div>
                                {credit > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Loyalty credit (upgrade)</span>
                                        <span className="text-emerald-400">−₹{credit}</span>
                                    </div>
                                )}
                                {discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Coupon ({appliedCoupon})</span>
                                        <span className="text-green-500">−₹{discount}</span>
                                    </div>
                                )}
                                <div className="border-t border-border pt-3 mt-3 flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span className="gold-text text-gold">₹{finalAmount}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <Lock className="h-3.5 w-3.5" />
                                <span>Secured by PCI-DSS compliant payment gateways</span>
                            </div>

                            <Button
                                variant="luxury"
                                onClick={handlePay}
                                disabled={paying || isBlocked || previewLoading}
                                className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em]"
                            >
                                {paying
                                    ? "Processing…"
                                    : isBlocked
                                        ? "Plan change blocked"
                                        : finalAmount === 0
                                            ? "Activate Plan (₹0)"
                                            : `Pay ₹${finalAmount}`}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default Checkout;
