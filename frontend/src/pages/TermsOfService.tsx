import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 pb-16">
                <div className="container mx-auto px-6 max-w-4xl">
                    <h1 className="text-3xl md:text-4xl font-bold mb-8">Terms of Service</h1>
                    <div className="prose prose-invert max-w-none text-muted-foreground space-y-6">
                        <p className="text-sm">Last Updated: December 2025</p>

                        <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
                        <p>
                            These Terms of Service govern your use of the MRDiet platform.
                            By accessing and using our services, you accept and agree to be bound by the terms and provision of this agreement.
                        </p>

                        <h2 className="text-xl font-semibold text-foreground">2. Medical Disclaimer</h2>
                        <p>
                            The content provided by us is for informational purposes only and is not intended as medical advice, or as a substitute for the medical advice of a physician.
                            Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
                        </p>

                        <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
                        <p>
                            To access certain features of the website, you may be required to create an account. You are responsible for maintaining the confidentiality of your account and password.
                        </p>

                        <h2 className="text-xl font-semibold text-foreground">4. Payments</h2>
                        <p>
                            All payments are final and non-refundable unless otherwise stated. We use secure third-party payment gateways for transactions.
                        </p>

                        <h2 className="text-xl font-semibold text-foreground">5. Changes to Terms</h2>
                        <p>
                            We reserve the right to modify these terms at any time. Your continued use of the site after such changes constitutes your acceptance of the new terms.
                        </p>

                        <h2 className="text-xl font-semibold text-foreground">6. Contact Information</h2>
                        <p>
                            If you have any questions about these Terms, please contact <strong>MRDiet Support</strong> at <strong>support@mrdietplan.in</strong>.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default TermsOfService;
