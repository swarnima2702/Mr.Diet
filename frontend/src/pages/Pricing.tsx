import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Check, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserSidebar from "@/components/UserSidebar";
import { api, getLogoUrl } from "@/lib/api";

const tierOf = (t: string) => {
    const s = (t || "").toLowerCase();
    if (s.includes("monthly")) return 3;
    if (s.includes("weekly")) return 2;
    if (s.includes("daily")) return 1;
    if (s.includes("trial")) return 0;
    return 0;
};

const Pricing = () => {
    const navigate = useNavigate();
    const settings = JSON.parse(window.localStorage.getItem("app_public_settings") || "{}");
    const logoUrl = getLogoUrl(settings.logo_dark || "");
    const [activeSub, setActiveSub] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem("mrdiet_auth_user");
        if (!stored) return;
        const u = JSON.parse(stored);
        api.subscriptions.getActiveByUserId(String(u.id)).then(setActiveSub).catch(() => setActiveSub(null));
    }, []);

    const currentTier = activeSub ? tierOf(activeSub.plan_type) : -1;

    const handleSignOut = () => {
        localStorage.removeItem("mrdiet_auth_user");
        window.location.href = "/auth";
    };

    const plans = [
        {
            key: "daily",
            name: "Daily",
            price: Number(settings.priceDaily) || 99,
            original: Number(settings.originalPriceDaily) || 199,
            days: 1,
            badge: "Try It",
            features: ["1 Day AI Plan", "Personalized to you", "Ideal for testing"],
        },
        {
            key: "weekly",
            name: "Weekly",
            price: Number(settings.priceWeekly) || 599,
            original: Number(settings.originalPriceWeekly) || 1399,
            days: 7,
            badge: "Most Popular",
            featured: true,
            features: ["7 Days AI Plans", "Daily check-ins", "Meal substitutions", "PDF download"],
        },
        {
            key: "monthly",
            name: "Monthly",
            price: Number(settings.priceMonthly) || 1999,
            original: Number(settings.originalPriceMonthly) || 5999,
            days: 30,
            badge: "Best Value",
            features: ["30 Days AI Plans", "Full transformation", "Priority support", "PDF download"],
        },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-foreground flex">
            <UserSidebar logoUrl={logoUrl} onSignOut={handleSignOut} />
            <main className="flex-1 min-h-screen overflow-y-auto overflow-x-hidden px-3 sm:px-4 md:px-8 py-6 md:py-10 pt-20 sm:pt-24 lg:pt-10">
                <div className="max-w-6xl mx-auto space-y-10">
                    <div className="text-center space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 mb-2">
                            <Sparkles className="h-3.5 w-3.5 text-gold" />
                            <span className="text-[10px] font-black gold-text uppercase tracking-[0.2em]">Pricing & Plans</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                            Choose Your <span className="text-gold">Plan</span>
                        </h1>
                        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
                            Cancel anytime. Coupon codes can be applied at checkout.
                        </p>
                    </div>

                    {activeSub && (
                        <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 text-center">
                            <p className="text-[11px] text-muted-foreground">
                                You're currently on the <span className="font-black text-gold uppercase tracking-wider">{activeSub.plan_type}</span> plan, active till{" "}
                                <span className="text-white font-bold">{activeSub.end_date}</span>.
                            </p>
                        </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-5">
                        {plans.map((p) => {
                            const planTier = tierOf(p.key);
                            const isCurrent = activeSub && tierOf(activeSub.plan_type) === planTier;
                            const isDowngrade = activeSub && planTier < currentTier;
                            const isUpgrade = activeSub && planTier > currentTier;

                            const ctaLabel = isCurrent
                                ? "Renew"
                                : isDowngrade
                                    ? "Lower Tier"
                                    : isUpgrade
                                        ? `Upgrade to ${p.name}`
                                        : `Choose ${p.name}`;

                            return (
                                <div
                                    key={p.key}
                                    className={`relative bg-[#0f0f0f] border rounded-2xl p-7 transition-all flex flex-col ${isCurrent
                                        ? "border-gold/60 shadow-[0_8px_60px_rgba(234,179,8,0.18)]"
                                        : isDowngrade
                                            ? "border-white/5 opacity-60"
                                            : p.featured
                                                ? "border-gold/50 shadow-[0_8px_60px_rgba(234,179,8,0.15)]"
                                                : "border-white/5 hover:border-gold/20"
                                        }`}
                                >
                                    {isCurrent ? (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-gold text-black">
                                            Your Plan
                                        </div>
                                    ) : p.badge && (
                                        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${p.featured ? "bg-gold text-black" : "bg-white/5 text-muted-foreground border border-white/10"}`}>
                                            {p.badge}
                                        </div>
                                    )}
                                    <h3 className="text-lg font-black text-white mb-1">{p.name} Plan</h3>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-5">{p.days} Day{p.days > 1 ? "s" : ""} Access</p>

                                    <div className="mb-6">
                                        <span className="text-[12px] text-muted-foreground line-through mr-2">₹{p.original}</span>
                                        <span className="text-4xl font-black text-white">₹{p.price}</span>
                                    </div>

                                    <ul className="space-y-2 mb-8 flex-1">
                                        {p.features.map((f) => (
                                            <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                <Check className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        variant={p.featured && !isDowngrade ? "luxury" : "luxuryOutline"}
                                        className="w-full h-11 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => navigate(`/checkout?plan=${p.key}`)}
                                        disabled={isDowngrade}
                                    >
                                        {isDowngrade && <Lock className="mr-2 h-3.5 w-3.5" />}
                                        {ctaLabel}
                                        {!isDowngrade && <ArrowRight className="ml-2 h-4 w-4" />}
                                    </Button>
                                    {isDowngrade && (
                                        <p className="text-[10px] text-muted-foreground text-center mt-2">Available after current plan ends</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Pricing;
