import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        <div
          data-aos="zoom-in"
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/30 mb-4">
            <span className="text-[10px] font-black gold-text uppercase tracking-[0.2em]">100% Free Day 1</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 px-4">
            Ready to <span className="gold-text">Transform</span>?
          </h2>

          <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-xl mx-auto px-4">
            Get your <span className="text-gold font-bold">AI diet plan free for Day 1</span>. No payment, no card. Join 1500+ clients.
          </p>

          <Link to="/auth">
            <Button variant="luxury" size="xl" className="group">
              GET MY FREE DAY 1 PLAN
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
