
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";

const AuthPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [authMode, setAuthMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // After auth, always land on dashboard — user starts with the Free Day 1 CTA there.
    const from = "/dashboard";

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                // Fetch user info from Google
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoResponse.json();

                const queryParams = new URLSearchParams(location.search);
                const referralCode = queryParams.get("ref") || "";
                
                // Send to backend
                const data = await api.auth.googleLoginManual({
                    email: userInfo.email,
                    name: userInfo.name,
                    google_id: userInfo.sub,
                    picture: userInfo.picture,
                    referral_code: referralCode
                });

                if (data.user) {
                    localStorage.setItem("mrdiet_auth_user", JSON.stringify(data.user));
                    toast.success("Successfully logged in with Google!");
                    navigate(from, { replace: true });
                }
            } catch (error: unknown) {
                console.error("Google Login Error:", error);
                toast.error("Google login failed. Please try again.");
            }
        },
        onError: () => toast.error("Google Login Failed to Initialize"),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let data;
            if (authMode === "signup") {
                if (!name) {
                    toast.error("Name is required");
                    setIsLoading(false);
                    return;
                }
                const queryParams = new URLSearchParams(location.search);
                const referralCode = queryParams.get("ref") || "";
                data = await api.auth.signup(email, password, name, referralCode);
                toast.success("Account created successfully!");
            } else {
                data = await api.auth.login(email, password);
                toast.success("Logged in successfully!");
            }

            if (data.user) {
                localStorage.setItem("mrdiet_auth_user", JSON.stringify(data.user));
                navigate(from, { replace: true });
            }
        } catch (error: unknown) {
            toast.error((error as Error)?.message || "Authentication failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-6 h-screen flex items-center justify-center pt-20">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">
                            {authMode === "login" ? "Welcome Back" : "Create Account"}
                        </CardTitle>
                        <CardDescription>
                            {authMode === "login" ? "Login to access your diet plan" : "Join us to start your journey"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as "login" | "signup")} className="w-full mb-6">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="login">Login</TabsTrigger>
                                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                            </TabsList>
                        </Tabs>



                        <form onSubmit={handleSubmit} className="space-y-4">
                            {authMode === "signup" && (
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <Button className="w-full" type="submit" disabled={isLoading} variant="luxury">
                                {isLoading ? "Processing..." : (authMode === "login" ? "Login" : "Create Account")}
                            </Button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full relative py-5 border-border hover:bg-gold/10 hover:text-gold hover:border-gold transition-all duration-300"
                            onClick={() => loginWithGoogle()}
                        >
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                            {authMode === "login" ? "Sign in with Google" : "Sign up with Google"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AuthPage;
