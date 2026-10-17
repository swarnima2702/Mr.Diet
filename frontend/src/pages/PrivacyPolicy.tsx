import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 pb-16">
                <div className="container mx-auto px-6 max-w-4xl">
                    <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
                    <div className="prose prose-invert max-w-none text-muted-foreground space-y-6">
                        <p className="text-sm">Last Updated: December 2025</p>

                        <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
                        <p>
                            Welcome to MRDiet. We respect your privacy and are
                            committed to protecting your personal data. This privacy policy will inform you as to how we look after your
                            personal data when you visit our website and tell you about your privacy rights.
                        </p>

                        <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
                        <p>
                            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Identity Data:</strong> name, age, gender, height, weight.</li>
                            <li><strong>Contact Data:</strong> email address and telephone numbers.</li>
                            <li><strong>Health Data:</strong> dietary preferences, allergies, medical conditions (for diet planning purposes).</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Data</h2>
                        <p>
                            We will only use your personal data when the law allows us to. Most commonly, we use your personal data
                            to generate personalized diet plans, process payments, and manage your account.
                        </p>

                        <h2 className="text-xl font-semibold text-foreground">4. Data Security</h2>
                        <p>
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost,
                            used or accessed in an unauthorized way.
                        </p>

                        <h2 className="text-xl font-semibold text-foreground">5. Contact Us</h2>
                        <p>
                            If you have any questions about this privacy policy, please contact <strong>MRDiet Support</strong> at <strong>support@mrdietplan.in</strong>.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
