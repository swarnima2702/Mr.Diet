import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, Star, Users, Award, Heart, Leaf, Activity } from "lucide-react";

const About = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="pt-32 pb-24 relative overflow-hidden font-poppins">
                {/* Background Decor */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gold/5 blur-[120px] rounded-full opacity-30 pointer-events-none" />
                <div className="absolute top-[20%] -right-20 w-80 h-80 bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
                
                <div 
                    className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" 
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />

                {/* Hero Section */}
                <section className="container mx-auto px-6 mb-24 relative z-10">
                    <div className="max-w-4xl mx-auto text-center" data-aos="fade-down">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 backdrop-blur-md mb-6">
                            <Star className="h-3.5 w-3.5 text-gold" />
                            <span className="text-[10px] font-black gold-text uppercase tracking-[0.2em]">Our Story</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight uppercase">
                            Redefining <span className="gold-text">Nutrition</span>
                        </h1>
                        <p className="text-muted-foreground/80 max-w-2xl mx-auto">
                            At MRDiet, we engineer biological transformations through precise, data-driven nutritional protocols tailored to your unique metabolic profile.
                        </p>
                    </div>
                </section>

                {/* Mission & Stats Section */}
                <section className="container mx-auto px-6 mb-32 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
                        <div className="order-2 lg:order-1 space-y-8" data-aos="fade-right">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white uppercase">Our Philosophy</h2>
                            <div className="space-y-6">
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Starvation is not the answer. Nourishment is. Most modern health issues stem from metabolic dysfunction and hormonal imbalances. Our mission is to fix the core of the problem using the most powerful medicine available: **Right Food Choice.**
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "No Starvation", icon: Heart },
                                    { label: "Real Food", icon: Leaf },
                                    { label: "AI Precision", icon: Activity },
                                    { label: "Life Support", icon: Users }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm group hover:border-gold/30 transition-all">
                                        <item.icon className="h-5 w-5 text-gold" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="order-1 lg:order-2 grid gap-6" data-aos="fade-left">
                            <div className="group relative overflow-hidden rounded-2xl border border-gold/20 bg-card/80 backdrop-blur-xl p-8 transition-all hover:border-gold/40 shadow-xl">
                                <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                                    <Users className="h-24 w-24 text-gold" />
                                </div>
                                <div className="relative space-y-2">
                                    <div className="text-3xl font-black gold-text italic tracking-tighter">1500+</div>
                                    <h4 className="font-bold text-base text-white">Clients Transformed</h4>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Health journeys across 12 countries.</p>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-md">
                                    <Award className="h-6 w-6 text-gold mb-4" />
                                    <h4 className="text-[11px] font-bold text-white mb-2 uppercase tracking-widest">Medical Accuracy</h4>
                                    <p className="text-[9px] text-muted-foreground">Plans cross-verified by our elite medical council.</p>
                                </div>
                                <div className="p-6 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-md">
                                    <Star className="h-6 w-6 text-gold mb-4" />
                                    <h4 className="text-[11px] font-bold text-white mb-2 uppercase tracking-widest">5-Star Feedback</h4>
                                    <p className="text-[9px] text-muted-foreground">Rated top-tier for adherence and results.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default About;
