import React from "react";
import { Bot, Zap, Globe, Cpu, Clock, MapPin } from "lucide-react";

const aiBenefits = [
  {
    icon: Clock,
    title: "24/7 Real-Time Availability",
    description: "Get your diet plan ready at any hour. Our AI never sleeps, ensuring you get your meals instantly after payment and check-in."
  },
  {
    icon: MapPin,
    title: "Geographical Adaptation",
    description: "Whether you're in South India, North India, or abroad, our AI detects your preferences to suggest meals based on locally available ingredients."
  },
  {
    icon: Globe,
    title: "Cultural Preferences",
    description: "AI that understands the difference between a Gujarati Thali and a Punjabi meal. Deeply rooted in regional Indian food cultures."
  },
  {
    icon: Zap,
    title: "Instant Metabolic Tweaks",
    description: "Your metabolism is dynamic. Our AI adjusts your macro-balance based on your weekly check-in data, ensuring you never plateau."
  }
];

export const AISection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gold/5 blur-[120px] -z-10" />
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 space-y-8">
            <div data-aos="fade-right" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/5 backdrop-blur-sm">
              <Bot className="h-4 w-4 text-gold" />
              <span className="text-xs font-bold text-gold uppercase tracking-wider">The Future of Nutrition</span>
            </div>
            <h2 data-aos="fade-right" data-aos-delay="100" className="text-4xl md:text-5xl font-bold leading-tight">
              Driven by <span className="gold-text">Next-Gen</span> AI.<br />
              Tailored by Experts.
            </h2>
            <p data-aos="fade-right" data-aos-delay="200" className="text-muted-foreground text-lg">
              MRDiet combines clinical nutritionist expertise with raw AI power to deliver 
              meticulously calculated meal plans in seconds.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-8 pt-4">
              {aiBenefits.map((benefit, i) => (
                <div key={i} data-aos="fade-up" data-aos-delay={300 + i * 100} className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                    <benefit.icon className="h-5 w-5 text-gold" />
                  </div>
                  <h4 className="font-bold">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-1/2 relative" data-aos="zoom-in">
            <div className="relative z-10 p-2 rounded-[2rem] border-2 border-gold/20 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800"
                alt="AI Nutrition Visualization" 
                className="rounded-[1.5rem] w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              <div className="absolute bottom-10 left-10 right-10 p-6 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex -space-x-3">
                    {[1,2,3].map(n => <div key={n} className="w-8 h-8 rounded-full border-2 border-primary bg-gold/20" />)}
                  </div>
                  <span className="text-xs font-medium">Joined by 12,000+ AI-optimized clients</span>
                </div>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-gold animate-shimmer" />
                </div>
              </div>
            </div>
            {/* Animated floating badges */}
            <div className="absolute -top-6 -right-6 p-4 rounded-xl bg-background border border-gold/30 shadow-xl animate-float">
               <Cpu className="h-8 w-8 text-gold" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
