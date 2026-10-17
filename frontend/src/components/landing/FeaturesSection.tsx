import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  Activity, 
  Droplets, 
  Scale, 
  Baby, 
  Moon, 
  AlertCircle,
  Zap
} from "lucide-react";

const audiences = [
  {
    icon: Heart,
    title: "PCOS & Hormonal Imbalance",
    description: "Specialized meal plans to balance hormones naturally and manage PCOS symptoms.",
  },
  {
    icon: Activity,
    title: "Thyroid Management",
    description: "Nutrition optimized for thyroid function, metabolism, and energy levels.",
  },
  {
    icon: Droplets,
    title: "Diabetes & Sugar Control",
    description: "Low glycemic plans designed to stabilize blood sugar and reduce insulin resistance.",
  },
  {
    icon: AlertCircle,
    title: "Fatty Liver Disease",
    description: "Liver-friendly diets to reduce fat accumulation and improve liver health.",
  },
  {
    icon: Scale,
    title: "Sustainable Weight Loss",
    description: "Science-backed approach to lose weight without crash diets or starvation.",
  },
  {
    icon: Baby,
    title: "Postpartum Mothers",
    description: "Safe nutrition for new mothers, supporting recovery and breastfeeding.",
  },
  {
    icon: Moon,
    title: "Night-Shift Professionals",
    description: "Tailored meal timing and nutrition for those with irregular schedules.",
  },
  {
    icon: Activity,
    title: "Body Transformation & Toning",
    description: "Build a lean, athletic physique with precision macro-balance and metabolic fueling.",
  },
  {
    icon: Zap,
    title: "Healthy Weight Gain",
    description: "Nutrient-rich, calorie-dense protocols for those struggling to gain weight or build muscle.",
  },
  {
    icon: Droplets,
    title: "Gut Health & Digestion",
    description: "Elimination-style diets to stop bloating, improve IBS symptoms, and heal your gut.",
  },
  {
    icon: Heart,
    title: "Maintenance & Longevity",
    description: "Sustainable daily routines to keep your results and live a longer, healthier life.",
  },
  {
    icon: AlertCircle,
    title: "Medical Restrictions",
    description: "Custom plans for those with doctor-prescribed dietary restrictions.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 relative" id="features">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/5 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2
            data-aos="fade-up"
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            Who Is This <span className="gold-text">For?</span>
          </h2>
          <p
            data-aos="fade-up"
            data-aos-delay="100"
            className="text-muted-foreground max-w-3xl mx-auto"
          >
            Whether you're looking for <strong>rapid fat loss</strong>, sustainable <strong>muscle gain</strong>, or specialized management for 
            PCOS and Thyroid conditions, our precision nutrition has you covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {audiences.map((item, index) => (
            <Card
              key={index}
              variant="luxury"
              data-aos="fade-up"
              data-aos-delay={100 + index * 50}
              className="group cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors duration-300">
                  <item.icon className="h-7 w-7 text-gold" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
