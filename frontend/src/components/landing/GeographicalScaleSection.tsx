import React from "react";
import { Globe, MapPin, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const regions = [
  { name: "North India", meals: ["Paneer Bhurji", "Oats Khichdi", "Dal Makhani (Lean Version)"] },
  { name: "South India", meals: ["Ragi Idli", "Moong Dal Dosa", "Brown Rice Sambhar"] },
  { name: "West India", meals: ["Gujarati Thepla (Sugar-free)", "Poha", "Dal Dhokli (Modified)"] },
  { name: "Global Adaptations", meals: ["Avocado Toast (Healthy)", "Chicken Quinoa", "Stir-fry Veggies"] }
];

export const GeographicalScaleSection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
           <div className="lg:w-1/2" data-aos="fade-right">
              <div className="inline-flex items-center gap-2 text-blue-400 mb-6">
                 <Globe className="h-5 w-5" />
                 <span className="text-xs font-bold uppercase tracking-[0.3em]">Geographical Precision</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                 AI that understands your <span className="gold-text italic tracking-tighter">Kitchen.</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-xl">
                 No more unrealistic "Avocado & Salmon" diets if you live in a place where only local dal and roti are available. Our AI detects your regional food availability and keeps your plan <strong>completely practical.</strong>
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10 p-6 rounded-2xl bg-secondary/30 border border-border/50">
                 <div className="space-y-1">
                    <p className="text-3xl font-bold gold-text">15,000+</p>
                    <p className="text-xs text-muted-foreground uppercase font-black">Meals Database</p>
                 </div>
                 <div className="hidden sm:block h-10 w-px bg-border/50" />
                 <div className="space-y-1">
                    <p className="text-3xl font-bold gold-text">100%</p>
                    <p className="text-xs text-muted-foreground uppercase font-black">Region specific</p>
                 </div>
              </div>
           </div>

           <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4" data-aos="fade-left">
              {regions.map((region, i) => (
                <Card key={i} variant="luxury" className={`hover:border-gold/30 transition-all ${i % 2 !== 0 ? 'sm:mt-8' : ''}`}>
                  <CardContent className="p-6 space-y-4">
                     <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-gold" />
                     </div>
                     <h4 className="font-bold text-lg">{region.name}</h4>
                     <ul className="space-y-2">
                        {region.meals.map((meal, j) => (
                          <li key={j} className="text-xs text-muted-foreground flex items-center gap-2 opacity-80 decoration-gold/30 group cursor-default">
                             <div className="w-1.5 h-1.5 rounded-full bg-gold/50 group-hover:scale-150 transition-transform" />
                             {meal}
                          </li>
                        ))}
                     </ul>
                  </CardContent>
                </Card>
              ))}
           </div>
        </div>
      </div>
    </section>
  );
};
