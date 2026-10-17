import React from "react";
import { Check, Sparkles, Smartphone, BarChart, Download } from "lucide-react";
import appMockup from "@/assets/mrdiet_app_mockup.png";

const features = [
  "Comprehensive dashboard showing daily meal timelines.",
  "Interactive water intake & lifestyle activity tracker.",
  "One-tap PDF download for grocery shopping or offline use.",
  "Purchase a plan and use it for at least 30 days to see real results.",
  "Seamless 24h plan-to-plan unlocking system."
];

export const ExperienceSection = () => {
  return (
    <section className="py-32 relative bg-card overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-gold/5 via-transparent to-transparent -z-10" />
      
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 data-aos="fade-up" className="text-3xl md:text-5xl font-black italic tracking-tighter mb-6">
            The <span className="gold-text">Premium</span> Digital Experience
          </h2>
          <p data-aos="fade-up" data-aos-delay="100" className="text-muted-foreground text-lg">
            Manage your entire health journey through our sophisticated dashboard designed for both performance and aesthetics.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative group p-4" data-aos="fade-right">
            <div className="absolute -inset-2 bg-gradient-to-r from-gold-dark to-gold opacity-10 blur-2xl group-hover:opacity-20 transition-opacity" />
            <img 
              src={appMockup} 
              alt="MRDiet App Dashboard Mockup" 
              className="relative z-10 w-full rounded-[2.5rem] border-8 border-gold/10 shadow-[0_50px_100px_-20px_rgba(212,175,55,0.3)] pointer-events-none select-none transition-all duration-500 hover:scale-[1.02]"
            />
          </div>

          <div className="space-y-10">
            <div data-aos="fade-left" className="space-y-4">
              <div className="inline-flex items-center gap-2 text-gold">
                <Smartphone className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Mobile First Dashboard</span>
              </div>
              <h3 className="text-3xl font-bold">Track Your Nutrition, Anywhere.</h3>
              <p className="text-muted-foreground leading-relaxed">
                Access your personalized meals on any device. NO complex apps to download — everything works perfectly through your secure browser dashboard.
              </p>
            </div>

            <div className="space-y-4">
              {features.map((feature, i) => (
                <div key={i} data-aos="fade-left" data-aos-delay={100 + i * 50} className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm group hover:border-gold/30 transition-all">
                  <div className="mt-1 w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center border border-gold/20 flex-shrink-0">
                    <Check className="h-3 w-3 text-gold" />
                  </div>
                  <span className="text-sm font-medium leading-tight opacity-90">{feature}</span>
                </div>
              ))}
            </div>

            <div data-aos="fade-left" data-aos-delay="400" className="pt-6">
               <div className="flex items-center gap-6 p-6 rounded-2xl bg-gold/5 border border-gold/20 relative overflow-hidden">
                  <BarChart className="h-10 w-10 text-gold opacity-30 absolute -right-4 -bottom-4" />
                  <div className="space-y-1">
                     <p className="text-xl font-bold">98% Success Rate</p>
                     <p className="text-xs text-muted-foreground">Recorded with our data-driven AI tracking method.</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
