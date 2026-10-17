import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Zoya Khan",
    role: "Premium Client",
    content: "Complex PCOD issues managed beautifully. My cycles are regular for the first time in years.",
    rating: 5,
  },
  {
    name: "Kiran Rao",
    role: "30-Day Plan",
    content: "Lost 5 kgs in a month without feeling hungry. Best decision ever!",
    rating: 5,
  },
  {
    name: "Sunita Verma",
    role: "30-Day Plan",
    content: "I never thought I could eat roti and sabzi and still lose weight. The MRDiet plan is magic!",
    rating: 5,
  },
  {
    name: "Vivek Kumar",
    role: "7-Day Reset",
    content: "Perfect reset button for my diet. The macro breakdown is very detailed.",
    rating: 5,
  },
];

const results = [
  {
    name: "Aditi S.",
    condition: "PCOS",
    result: "Lost 8 kg in 45 days. Regular cycles restored.",
  },
  {
    name: "Vikram R.",
    condition: "DIABETES",
    result: "Sugar levels normalized. Medicine reduced.",
  },
  {
    name: "Sneha P.",
    condition: "POSTPARTUM",
    result: "Safe 12 kg loss in 3 months while breastfeeding.",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6 relative z-10">
        {/* Real Results Section */}
        <div className="text-center mb-16">
          <h2
            data-aos="fade-up"
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            Real <span className="gold-text">Results</span>
          </h2>
          <p
            data-aos="fade-up"
            data-aos-delay="100"
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Results vary based on adherence and history. Here are some of our success stories.
          </p>
        </div>

        {/* Results Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {results.map((result, index) => (
            <div
              key={index}
              data-aos="fade-up"
              data-aos-delay={100 + index * 100}
              className="p-6 rounded-2xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">{result.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold">
                  {result.condition}
                </span>
              </div>
              <p className="text-muted-foreground">{result.result}</p>
            </div>
          ))}
        </div>

        {/* Client Words Section */}
        <div className="text-center mb-12">
          <h3
            data-aos="fade-up"
            className="text-2xl md:text-3xl font-bold mb-2"
          >
            Client <span className="gold-text">Words</span>
          </h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              variant="luxury"
              data-aos="fade-up"
              data-aos-delay={100 + index * 100}
              className="relative"
            >
              <CardContent className="p-6">
                {/* Quote icon */}
                <Quote className="h-8 w-8 text-gold/20 absolute top-4 right-4" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-foreground/90 mb-6 text-sm leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-xs text-gold">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
