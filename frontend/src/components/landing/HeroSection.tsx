import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Users, Clock, Shield, Star, Leaf, ChevronRight, ChevronLeft } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import heroFood from "@/assets/hero-food.jpg";
import { useAppConfig } from "@/hooks/useAppConfig";

const stats = [
  { icon: Users, value: "1500+", label: "Clients Helped" },
  { icon: Clock, value: "5m", label: "Delivery Time" },
  { icon: Shield, value: "100%", label: "Clinical Logic" },
  { icon: Star, value: "5★", label: "Rated Plans" },
];

const HeroSection = () => {
  const cfg = useAppConfig();
  const priceDaily = Number(cfg.priceDaily) || 99;

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-20 md:pt-32 md:pb-24">
      {/* Background Image with Layered Overlay */}
      <div className="absolute inset-0 bg-[#050505]">
        <img
          src={heroFood}
          alt="Premium healthy food arrangement"
          className="w-full h-full object-cover opacity-20 mix-blend-luminosity grayscale contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
      </div>

      {/* Enhanced tech-grid background */}
      {/* Inline Robust Noise Overlay - Fixed 403 issue */}
      <div 
        className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
      <div className="absolute inset-0 bg-grid-white/[0.015] bg-[size:60px_60px]" />
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-gold/10 via-background to-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gold/5 blur-[120px] rounded-full opacity-50" />
      <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-gold/10 rounded-full blur-3xl animate-pulse" />

      <div className="container mx-auto px-4 md:px-6 relative z-10 w-full">
        <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-8 lg:gap-12 items-center max-w-[1400px] mx-auto">
          {/* Left Column: Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 sm:space-y-8 w-full overflow-hidden">
            <div data-aos="fade-down" className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 backdrop-blur-md">
              <Leaf className="h-3.5 w-3.5 text-gold" />
              <span className="text-[10px] font-black gold-text uppercase tracking-[0.2em]">Next-Gen Health Tech</span>
            </div>

            <h1
              data-aos="fade-up"
              className="text-2xl sm:text-3xl md:text-5xl lg:text-[4.2rem] font-bold leading-[1.3] sm:leading-[1.1] md:leading-[1.05] tracking-tight uppercase break-words w-full"
            >
              <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">AI-Powered</span><br />
              <span className="gold-text drop-shadow-[0_0_20px_rgba(234,179,8,0.2)]">Custom Nutrition</span>
            </h1>

              <p
                data-aos="fade-up"
                data-aos-delay="100"
                className="text-[11px] sm:text-base md:text-[1.1rem] text-muted-foreground/80 leading-relaxed font-medium px-4 sm:px-0 max-w-[700px]"
              >
                Experience the next generation of precision health with India's most advanced AI-driven nutrition platform. Get scientifically-backed protocols specifically designed for <span className="text-white font-bold">PCOS, Thyroid, Diabetes, Muscle Building, and sustainable Weight Loss or Weight Gain</span>. No generic charts—just data-driven nutrition tailored to your unique biology.
              </p>

            {/* Badges - More Premium */}
            <div
              data-aos="fade-up"
              data-aos-delay="300"
              className="flex flex-wrap justify-center lg:justify-start gap-x-3 sm:gap-x-6 gap-y-3 pt-2 px-4"
            >
              {[
                { label: "100% AI Logic", color: "text-blue-400" },
                { label: "Doctor Reviewed", color: "text-emerald-400" },
                { label: "Expert Support", color: "text-gold" }
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-gold animate-pulse" />
                  <span className="text-[9px] sm:text-[11px] text-foreground font-semibold tracking-wider sm:tracking-widest capitalize sm:uppercase">{badge.label}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons - Premium Sizing */}
            <div
              data-aos="fade-up"
              data-aos-delay="400"
              className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start items-center pt-4 w-full px-4 sm:px-0"
            >
              <Link to="/auth" className="w-full sm:w-auto px-4 sm:px-0">
                <Button variant="luxury" className="w-full sm:w-auto h-14 px-6 sm:px-10 rounded-2xl group shadow-[0_0_40px_rgba(234,179,8,0.2)] text-black font-extrabold">
                  <span className="text-xs sm:text-sm uppercase tracking-widest">Get Day 1 Plan — Free</span>
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a href="#pricing" className="text-[10px] sm:text-xs font-black text-muted-foreground hover:text-gold transition-colors uppercase tracking-[0.2em] border-b border-transparent hover:border-gold pb-1">
                Explore All Plans
              </a>
            </div>
          </div>

          {/* Right Column: Sliding Plan Carousel */}
          <div
            data-aos="fade-up"
            data-aos-delay="400"
            className="w-full max-w-[calc(100vw-32px)] sm:max-w-[380px] md:max-w-[420px] mx-auto lg:ml-auto relative"
          >
            {/* Glossy decorative element */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold/20 rounded-full blur-[80px] -z-10" />
            <PlanCarousel />
          </div>
        </div>

        {/* Stats - More Premium Glassmorphism */}
        <div className="max-w-[1400px] mx-auto mt-20 sm:mt-16 lg:mt-24 px-4 sm:px-0">
          <div
            data-aos="fade-up"
            data-aos-delay="600"
            className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-md"
          >
            {stats.map((stat, index) => (
              <div key={index} className="bg-[#050505]/40 p-4 sm:p-6 text-center group hover:bg-gold/5 transition-colors">
                <div className="text-lg sm:text-2xl font-bold text-white mb-0.5 group-hover:text-gold transition-colors">{stat.value}</div>
                <div className="text-[10px] md:text-[9px] text-muted-foreground font-bold uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

const PlanCarousel = () => {
  const cfg = useAppConfig();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 50 });
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  const plans = [
    {
      id: "daily",
      name: "Daily Plan",
      price: Number(cfg.priceDaily) || 99,
      originalPrice: Number(cfg.originalPriceDaily) || 199,
      tag: "Best Entry Point",
      features: [
        "1-Day Custom Ledger",
        "Immediate Access",
        "Macro Mapping",
        "PDF Download",
      ],
    },
    {
      id: "weekly",
      name: "Weekly Plan",
      price: Number(cfg.priceWeekly) || 599,
      originalPrice: Number(cfg.originalPriceWeekly) || 1399,
      tag: "Most Popular",
      features: [
        "7-Day Strategy",
        "Metabolic Profiling",
        "Macro Deep-Dive",
        "Full Support",
      ],
    },
    {
      id: "monthly",
      name: "Monthly Plan",
      price: Number(cfg.priceMonthly) || 1999,
      originalPrice: Number(cfg.originalPriceMonthly) || 5999,
      tag: "Elite Results",
      features: [
        "30-Day Roadmap",
        "Weekly AI Updates",
        "Priority Support",
        "Doc Supervision",
      ],
    },
  ];

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative group/carousel">
      {/* Background Stacks - Visual Depth (Desktop Only) */}
      <div className="hidden md:block absolute top-2 -right-3 w-full h-[95%] bg-gold/5 rounded-2xl -z-20 border border-white/5 opacity-50" />
      <div className="hidden md:block absolute top-1 -right-1.5 w-full h-[98%] bg-card/60 backdrop-blur-md rounded-2xl -z-10 border border-white/5 opacity-80" />

      <div className="relative p-0.5 rounded-2xl bg-gradient-to-b from-gold/40 via-gold/5 to-transparent shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
        <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
          <div className="flex">
            {plans.map((plan, idx) => (
              <div key={idx} className="flex-[0_0_100%] min-w-0 bg-[#0a0a0a]/95 backdrop-blur-3xl p-5 sm:p-6 space-y-5 min-h-[420px] sm:min-h-[460px] flex flex-col">
                <div className="space-y-1">
                  <div className="inline-flex px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest">
                    {plan.tag}
                  </div>
                  <h3 className="text-2xl font-bold text-white leading-none">{plan.name}</h3>
                  <p className="text-[10px] text-muted-foreground font-semibold tracking-widest">Ai Custom Nutrition</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground line-through decoration-red-500/50 font-bold">
                      ₹{plan.originalPrice}
                    </span>
                    <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-none tracking-tighter">
                      ₹{plan.price}
                    </span>
                  </div>
                  <div className="h-10 w-px bg-white/10" />
                  <div className="space-y-0.5">
                    <span className="block text-[9px] font-bold text-gold uppercase tracking-[0.2em]">
                      Limited Time
                    </span>
                    {plan.originalPrice > plan.price && (() => {
                      const discountPercent = Math.round((1 - plan.price / plan.originalPrice) * 100);
                      return (
                        <span className="block text-lg sm:text-xl font-bold text-green-500">
                          {discountPercent}% Off
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {timer && (
                  <div className="mt-2 sm:mt-4 w-full flex items-center justify-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 border border-orange-500/20">
                    <div className="flex items-center gap-2 sm:gap-4 font-mono text-[13px] sm:text-base font-bold">
                      <div className="flex flex-col items-center">
                        <span className="bg-orange-500/20 text-orange-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded">{String(timer.days).padStart(2, '0')}</span>
                        <span className="text-[7px] uppercase mt-1 text-orange-500/70">Days</span>
                      </div>
                      <span className="text-orange-500 pb-4">:</span>
                      <div className="flex flex-col items-center">
                        <span className="bg-orange-500/20 text-orange-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded">{String(timer.hours).padStart(2, '0')}</span>
                        <span className="text-[7px] uppercase mt-1 text-orange-500/70">Hrs</span>
                      </div>
                      <span className="text-orange-500 pb-4">:</span>
                      <div className="flex flex-col items-center">
                        <span className="bg-orange-500/20 text-orange-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded">{String(timer.minutes).padStart(2, '0')}</span>
                        <span className="text-[7px] uppercase mt-1 text-orange-500/70">Min</span>
                      </div>
                      <span className="text-orange-500 pb-4">:</span>
                      <div className="flex flex-col items-center">
                        <span className="bg-orange-500/20 text-orange-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded">{String(timer.seconds).padStart(2, '0')}</span>
                        <span className="text-[7px] uppercase mt-1 text-orange-500/70">Sec</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-white/5">
                  {plan.features.slice(0, 4).map((feat, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="h-4 w-4 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 text-gold" />
                      </div>
                      <span className="text-[11px] sm:text-[12px] font-medium text-white/80">{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-4 sm:pt-6 flex flex-col gap-4">
                  <Link to={`/auth?plan=${plan.id}`} className="block w-full">
                    <Button variant="luxury" className="w-full h-11 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg group">
                      Claim Now
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex items-center gap-1.5">
                       <Users className="h-3 w-3 text-muted-foreground" />
                       <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-widest">340+ Joined</span>
                    </div>
                    
                    <button 
                      onClick={() => emblaApi?.scrollNext()}
                      className="group/next flex items-center gap-1.5 text-gold hover:text-white transition-colors"
                    >
                      <span className="text-[9px] font-bold uppercase tracking-widest">Next</span>
                      <ChevronRight className="h-3 w-3 group-hover/next:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Dots for Navigation */}
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
        {plans.map((_, i) => (
          <button 
            key={i} 
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${selectedIndex === i ? 'w-10 bg-gold' : 'w-2 bg-white/20 hover:bg-white/40'}`} 
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSection;