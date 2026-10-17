import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, MapPin, Phone } from "lucide-react";

const Contact = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="pt-32 pb-24 relative overflow-hidden font-poppins">
                {/* Background Decor */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gold/5 blur-[120px] rounded-full opacity-30 pointer-events-none" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/10 blur-[100px] rounded-full opacity-20 pointer-events-none" />

                <section className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center mb-16" data-aos="fade-down">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 backdrop-blur-md mb-6">
                            <Mail className="h-3.5 w-3.5 text-gold" />
                            <span className="text-[10px] font-black gold-text uppercase tracking-[0.2em]">Connect with us</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight uppercase">Get In <span className="gold-text">Touch</span></h1>
                        <p className="text-muted-foreground/80 max-w-2xl mx-auto">
                            Our support team is ready to assist you on your health journey. Reach out through any of our official channels.
                        </p>
                    </div>

                    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6" data-aos="fade-up" data-aos-delay="100">
                        {/* Email Card */}
                        <div className="group relative p-8 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl transition-all hover:border-gold/30 hover:shadow-[0_8px_40px_hsl(43_74%_49%_/_0.15)]">
                             <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors">
                                <Mail className="h-6 w-6 text-gold" />
                             </div>
                             <h3 className="text-lg font-bold text-white mb-1">Email Support</h3>
                             <p className="text-[10px] text-muted-foreground mb-6 uppercase tracking-widest font-bold">Official Queries</p>
                             <div className="pt-4 border-t border-border/50">
                                <p className="text-sm font-bold text-white break-all">support@mrdietplan.in</p>
                             </div>
                        </div>

                        {/* WhatsApp Card */}
                        <div className="group relative p-8 rounded-2xl border border-gold/40 bg-gold/10 backdrop-blur-xl transition-all hover:border-gold/60 shadow-[0_8px_40px_hsl(43_74%_49%_/_0.2)]">
                             <div className="w-12 h-12 rounded-xl bg-gold flex items-center justify-center mb-6">
                                <Phone className="h-6 w-6 text-black" />
                             </div>
                             <h3 className="text-lg font-bold text-white mb-1">WhatsApp</h3>
                             <p className="text-[10px] text-muted-foreground mb-6 uppercase tracking-widest font-bold">Instant Assistant</p>
                             <div className="pt-4 border-t border-gold/20">
                                <p className="text-sm font-bold text-white tracking-widest">+91 9322820524</p>
                             </div>
                        </div>

                        {/* Location Card */}
                        <div className="group relative p-8 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl transition-all hover:border-gold/30 hover:shadow-[0_8px_40px_hsl(43_74%_49%_/_0.15)]">
                             <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors">
                                <MapPin className="h-6 w-6 text-gold" />
                             </div>
                             <h3 className="text-lg font-bold text-white mb-1">Location</h3>
                             <p className="text-[10px] text-muted-foreground mb-6 uppercase tracking-widest font-bold">Corporate Office</p>
                             <div className="pt-4 border-t border-border/50">
                                <p className="text-sm font-bold text-white">Mumbai, India</p>
                             </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default Contact;
