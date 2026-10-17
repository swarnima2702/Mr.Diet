import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What will my diet plan PDF look like?",
    answer: "It is a professionally designed PDF containing your daily meal schedule, exact portions, grocery list, and recipe guidelines.",
  },
  {
    question: "How quickly will I receive my plan?",
    answer: "Our expert team reviews your info personally. You will receive the plan within 5 minutes of successful payment.",
  },
  {
    question: "Can I upgrade from 30-Day to Ultimate later?",
    answer: "Yes, you can upgrade at any time by paying the difference and contacting support.",
  },
  {
    question: "I have multiple conditions (PCOS + Thyroid). Will this work?",
    answer: "Absolutely. The intake form asks specifically for medical history so our clinicians can tailor the macro-nutrient balance for your specific conditions.",
  },
  {
    question: "Is online payment secure?",
    answer: "Yes, we use Cashfree, a PCI-DSS compliant payment gateway. We do not store your card details.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-24 relative" id="faqs">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2
            data-aos="fade-up"
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            Frequently Asked <span className="gold-text">Questions</span>
          </h2>
        </div>

        <div className="max-w-3xl mx-auto" data-aos="fade-up" data-aos-delay="100">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border/50 rounded-xl px-6 bg-card/50 backdrop-blur-sm"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
