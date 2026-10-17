import { Toaster } from "@/components/ui/toaster";
// Trigger HMR update
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import PeriodTracker from "./pages/PeriodTracker";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID } from "./lib/api";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserProfiles from "./pages/admin/AdminUserProfiles";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminAuth from "./pages/admin/AdminAuth";
import AdminProfileEdit from "./pages/admin/AdminProfileEdit";
import PartnerProgram from "./pages/PartnerProgram";
import Profile from "./pages/Profile";
import PaymentHistory from "./pages/PaymentHistory";
import HealthMetrics from "./pages/HealthMetrics";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import ComingSoon from "./pages/ComingSoon";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminTransactions from "./pages/admin/AdminTransactions";
import { api, syncConfig, API_BASE_URL } from "./lib/api";
import { useOneSignalInit } from "./hooks/useOneSignalInit";
const queryClient = new QueryClient();

// Old /get-started links → redirect to /auth (logged-out) or /health-metrics (logged-in),
// preserving the ?plan= query param.
const GetStartedRedirect = () => {
  const isLoggedIn = !!localStorage.getItem("mrdiet_auth_user");
  const search = window.location.search || "";
  return <Navigate to={`${isLoggedIn ? "/health-metrics" : "/auth"}${search}`} replace />;
};

const App = () => {
  useEffect(() => {
    AOS.init({
      once: true,
      duration: 800,
      easing: "ease-out-cubic",
    });

    // Global Referral Tracking
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      console.log("[MRDiet] Saving referral code:", ref);
      localStorage.setItem("mrdiet_referral_code", ref);
    }

    // Fetch initial config
    const loadConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings_public.php?_t=${Date.now()}`);
        if (!response.ok) {
          console.warn("[MRDiet] Config endpoint returned non-OK status:", response.status, "- using defaults");
          return;
        }
        const text = await response.text();
        if (!text || text.trim().startsWith("<")) {
          console.warn("[MRDiet] Config endpoint returned HTML instead of JSON - using defaults");
          return;
        }
        const config = JSON.parse(text);
        syncConfig(config);
      } catch (e) {
        console.warn("Failed to load global config (non-fatal):", e);
      }
    };
    loadConfig();
  }, []);

  // Initialize OneSignal with dynamic config
  useOneSignalInit();

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <WhatsAppButton />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/get-started" element={<GetStartedRedirect />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/health-metrics" element={<HealthMetrics />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/partner" element={<PartnerProgram />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/payments" element={<PaymentHistory />} />
              <Route path="/period-tracker" element={<PeriodTracker />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/coming-soon" element={<ComingSoon />} />
              
              {/* Admin Routes */}
              <Route path="/admin/auth" element={<AdminAuth />} />
              <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
              <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUsers /></ProtectedAdminRoute>} />
              <Route path="/admin/user-profiles" element={<ProtectedAdminRoute><AdminUserProfiles /></ProtectedAdminRoute>} />
              <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>} />
              <Route path="/admin/coupons" element={<ProtectedAdminRoute><AdminCoupons /></ProtectedAdminRoute>} />
              <Route path="/admin/transactions" element={<ProtectedAdminRoute><AdminTransactions /></ProtectedAdminRoute>} />
              <Route path="/admin/withdrawals" element={<ProtectedAdminRoute><AdminWithdrawals /></ProtectedAdminRoute>} />
              <Route path="/admin/profile-edit/:id" element={<ProtectedAdminRoute><AdminProfileEdit /></ProtectedAdminRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
