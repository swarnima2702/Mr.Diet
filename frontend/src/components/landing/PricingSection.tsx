import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Star, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppConfig } from "@/hooks/useAppConfig";
import { useState, useEffect, useRef } from "react";

const PricingSection = () => {
  const cfg = useAppConfig();

  const plans = [
    {
      name: "Daily Plan",
      planKey: "daily",
      price: Number(cfg.priceDaily) || 99,
      originalPrice: Number(cfg.originalPriceDaily) || 199,
      description: "Quick single-day custom meal & lifestyle guide.",
      features: [
        "1-Day Custom Meal Plan",
        "Instant Support Protocol",
        "Lifetime PDF Download",
        "Smart Meal Swaps",
      ],
      featured: false,
      badge: null,
    },
    {
      name: "Weekly Plan",
      planKey: "weekly",
      price: Number(cfg.priceWeekly) || 599,
      originalPrice: Number(cfg.originalPriceWeekly) || 1399,
      description: "Intensive 7-day health reset & metabolic guide.",
      features: [
        "Full 7-Day Custom Strategy",
        "Macro & Micro Nutrient Layout",
        "Daily Timeline & Schedule",
        "Everything in Daily",
      ],
      featured: true,
      badge: "MOST POPULAR",
    },
    {
      name: "Monthly Plan",
      planKey: "monthly",
      price: Number(cfg.priceMonthly) || 1999,
      originalPrice: Number(cfg.originalPriceMonthly) || 5999,
      description: "Complete 30-day medical-grade transformation.",
      features: [
        "Full 30-Day Health Roadmap",
        "Weekly Metabolic Updates",
        "Priority Doctor Response",
        "Everything in Weekly",
      ],
      featured: false,
      badge: "ELITE",
    },
  ];

  // Countdown timer logic
  const offerEnabled = cfg.offerEnabled === "1";
  const offerStartDate = cfg.offerStartDate;
  const offerDurationDays = Number(cfg.offerDurationDays) || 90;

  const getEndDate = () => {
    if (!offerStartDate) return 0;
    const start = new Date(offerStartDate).getTime();
    return start + offerDurationDays * 24 * 60 * 60 * 1000;
  };

  const [timeLeft, setTimeLeft] = useState(() => {
    const endDate = getEndDate();
    return endDate > 0 ? Math.max(0, endDate - Date.now()) : 0;
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!offerEnabled || !offerStartDate) {
      setTimeLeft(0);
      return;
    }
    const endDate = getEndDate();
    const remaining = endDate - Date.now();
    if (remaining <= 0) {
      setTimeLeft(0);
      return;
    }
    setTimeLeft(remaining);
    intervalRef.current = setInterval(() => {
      const left = endDate - Date.now();
      if (left <= 0) {
        setTimeLeft(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        setTimeLeft(left);
      }
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [offerEnabled, offerStartDate, offerDurationDays]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
  };

  const timer = timeLeft > 0 ? formatTime(timeLeft) : null;
  return (
    <section className="py-24 relative" id="pricing">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-12 sm:mb-16 px-4">
          <h2
            data-aos="fade-up"
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
          >
            Choose Your <span className="gold-text">Strategy</span>
          </h2>
          <p
            data-aos="fade-up"
            data-aos-delay="100"
            className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2"
          >
            All plans manually reviewed by MRDiet expert clinicians.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto px-2 sm:px-0">
          {plans.map((plan, index) => (
            <Card
              key={index}
              variant={plan.featured ? "featured" : "pricing"}
              data-aos="fade-up"
              data-aos-delay={100 + index * 100}
              className={`relative flex flex-col h-full ${plan.featured ? "md:scale-105 z-10 border-gold shadow-2xl" : ""}`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <div className="flex items-center gap-1 px-4 py-1 rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light text-primary-foreground text-xs sm:text-sm font-semibold whitespace-nowrap">
                    {plan.badge === "PREMIUM" ? <Star className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
                    {plan.badge}
                  </div>
                </div>
              )}

              <CardHeader className="text-center pt-8 sm:pt-10 px-4">
                <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
                <CardDescription className="mt-2 text-xs sm:text-sm min-h-[30px] sm:min-h-[40px] px-2">{plan.description}</CardDescription>
                {timer && (
                  <div className="mt-4 flex items-center justify-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 border border-orange-500/20">
                    <Clock className="h-3.5 w-3.5 text-orange-500 animate-pulse hidden sm:block" />
                    <div className="flex items-center gap-1 sm:gap-1.5 font-mono text-[11px] sm:text-sm font-bold">
                      <span className="bg-orange-500/20 text-orange-400 px-1.5 sm:px-2 py-1 rounded">{String(timer.days).padStart(2, '0')}d</span>
                      <span className="text-orange-500">:</span>
                      <span className="bg-orange-500/20 text-orange-400 px-1.5 sm:px-2 py-1 rounded">{String(timer.hours).padStart(2, '0')}h</span>
                      <span className="text-orange-500">:</span>
                      <span className="bg-orange-500/20 text-orange-400 px-1.5 sm:px-2 py-1 rounded">{String(timer.minutes).padStart(2, '0')}m</span>
                      <span className="text-orange-500">:</span>
                      <span className="bg-orange-500/20 text-orange-400 px-1.5 sm:px-2 py-1 rounded">{String(timer.seconds).padStart(2, '0')}s</span>
                    </div>
                  </div>
                )}
                <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
                  <span className="text-base sm:text-lg text-muted-foreground line-through">₹{plan.originalPrice}</span>
                  <span className="text-4xl sm:text-5xl font-bold gold-text">₹{plan.price}</span>
                  {plan.originalPrice > plan.price && (() => {
                    const discountPercent = Math.round((1 - plan.price / plan.originalPrice) * 100);
                    return discountPercent > 0 ? (
                      <span className="text-[10px] sm:text-xs font-bold text-green-500 bg-green-500/10 px-2 sm:px-2.5 py-1 rounded-full">{discountPercent}% OFF</span>
                    ) : null;
                  })()}
                </div>
              </CardHeader>

              <CardContent className="pt-4 sm:pt-6 px-5 sm:px-6 flex-grow">
                <ul className="space-y-3 sm:space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gold" />
                      </div>
                      <span className="text-xs sm:text-sm text-foreground/90">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4 sm:pt-6 px-5 sm:px-6 mt-auto">
                <Link to={`/auth?plan=${plan.planKey}`} className="w-full">
                  <Button
                    variant={plan.featured ? "luxury" : "luxuryOutline"}
                    size="lg"
                    className="w-full h-11 sm:h-12 text-xs sm:text-sm font-bold"
                  >
                    {plan.badge === "PREMIUM" ? "Go Premium" : "Select Plan"}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
