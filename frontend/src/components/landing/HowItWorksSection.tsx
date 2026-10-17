import { MessageCircle, UserCheck, CreditCard, FileText, Zap, Clock } from "lucide-react";

const steps = [
  {
    icon: MessageCircle,
    title: "Smart Consultation",
    description: "Complete a quick 10-minute assessment of your body type, metabolism, and lifestyle.",
  },
  {
    icon: UserCheck,
    title: "Metabolic Analysis",
    description: "Our system instantly analyzes your data to formulate a precise 6-meal protocol.",
  },
  {
    icon: CreditCard,
    title: "Secure Payment",
    description: "Activate your journey with instant UPI/Card payment and get immediate access.",
  },
  {
    icon: FileText,
    title: "Instant Dashboard",
    description: "Access your personalized plan, professional summaries, and dynamic daily support instantly.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 relative" id="how-it-works">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/5 to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2
            data-aos="fade-up"
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            How It <span className="gold-text">Works</span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-gold/50 via-gold to-gold/50" />

            {steps.map((step, index) => (
              <div
                key={index}
                data-aos={index % 2 === 0 ? "fade-right" : "fade-left"}
                data-aos-delay={100 + index * 100}
                className={`flex items-center gap-8 mb-12 last:mb-0 ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
              >
                {/* Content */}
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>

                {/* Icon */}
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-card border-2 border-gold flex items-center justify-center shadow-[0_0_30px_hsl(43_74%_49%_/_0.3)]">
                  <step.icon className="h-8 w-8 text-gold" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gold text-primary-foreground text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>

                {/* Spacer for alignment */}
                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>

        {/* Advance Request Note */}
        <div className="max-w-5xl mx-auto mt-20 grid md:grid-cols-2 gap-6" data-aos="fade-up">
          {/* English Card */}
          <div className="relative group overflow-hidden rounded-3xl border border-gold/20 bg-card p-8 transition-all hover:border-gold/40 shadow-xl">
            <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <Clock className="h-32 w-32 text-gold" />
            </div>
            <div className="relative space-y-4">
              <div className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black bg-gold/10 text-gold uppercase tracking-[0.2em] border border-gold/20">
                English Instructions
              </div>
              <h3 className="text-xl font-bold tracking-tight">Important Notes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Please <strong>purchase a plan and use it for at least 30 days</strong> to achieve the best results and experience a complete health transformation.
              </p>
            </div>
          </div>

          {/* Hindi Card */}
          <div className="relative group overflow-hidden rounded-3xl border border-blue-500/20 bg-card p-8 transition-all hover:border-blue-500/40 shadow-xl">
            <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <Zap className="h-32 w-32 text-blue-400" />
            </div>
            <div className="relative space-y-4">
              <div className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black bg-blue-500/10 text-blue-400 uppercase tracking-[0.2em] border border-blue-500/20">
                Hindi Instructions
              </div>
              <h3 className="text-xl font-bold tracking-tight">Important Notes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                Behtar results ke liye <strong>kam se kam 30 din ka plan purchase kare</strong> aur use lagatar follow kare taaki aapki transformation journey complete ho sake.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HowItWorksSection;
