import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Rocket, ArrowLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const ComingSoon = () => {
  const [params] = useSearchParams();
  const platform = params.get("platform"); // "playstore" | "appstore" | null

  const platformLabel =
    platform === "playstore"
      ? "Google Play Store"
      : platform === "appstore"
      ? "Apple App Store"
      : "Mobile App";

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-6">
          <Rocket className="h-10 w-10 text-gold" />
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
          Coming Soon
        </h1>

        <p className="text-muted-foreground text-sm mb-2 leading-relaxed">
          Our <span className="text-gold font-semibold">{platformLabel}</span> app is on its way.
        </p>
        <p className="text-muted-foreground text-xs mb-8 leading-relaxed max-w-sm mx-auto">
          We're polishing the final touches to bring you the best on-the-go diet
          tracking experience. Stay tuned — it'll be worth the wait.
        </p>

        <div className="p-4 rounded-xl bg-secondary/20 border border-white/5 mb-8 flex items-start gap-3 text-left">
          <Bell className="h-4 w-4 text-gold shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Meanwhile, keep using the web app — your plans, progress, and
            history will sync automatically once the mobile app launches.
          </p>
        </div>

        <Link to="/dashboard">
          <Button variant="luxury" size="lg" className="font-bold text-sm tracking-wide">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ComingSoon;
